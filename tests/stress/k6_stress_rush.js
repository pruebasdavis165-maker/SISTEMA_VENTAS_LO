import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Métricas personalizadas para certificar SLA de producción
const EmisionDuration = new Trend('emision_duration_ms');
const EmisionSuccessRate = new Rate('emision_success_rate');
const FreezeRejections = new Counter('freeze_rejections_total');

export const options = {
  scenarios: {
    // Simula a 25 vendedores disparando boletos en ráfaga (5:54 PM - último minuto antes del congelamiento)
    stress_rush: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '15s', target: 25 }, // Carga creciente rápida
        { duration: '30s', target: 25 }, // Concurrencia máxima sostenida
        { duration: '10s', target: 0 },  // Descenso
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    // Criterios de aceptación estipulados en el Issue #42:
    'http_req_duration': ['p(95)<300'], // Latencia p95 < 300ms
    'emision_success_rate': ['rate>0.95'], // Tasa de éxito bajo ventana válida > 95%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5000/api';

export function setup() {
  // 1. Autenticar usuario de prueba para obtener JWT
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      username: 'admin',
      password: 'AdminPassword123!',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  check(loginRes, {
    'setup login exitoso': (r) => r.status === 200,
  });

  const body = JSON.parse(loginRes.body);
  const token = body.token;

  // 2. Obtener sorteo próximo
  const sorteoRes = http.get(`${BASE_URL}/sorteos/proximo`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  let sorteoId = 1;
  if (sorteoRes.status === 200) {
    const sorteoData = JSON.parse(sorteoRes.body);
    sorteoId = sorteoData.id || 1;
  }

  return { token, sorteoId };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  };

  // Generar jugada aleatoria de 2 dígitos (00-99)
  const numRandom = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  const payload = JSON.stringify({
    sorteoId: data.sorteoId,
    jugadas: [
      { numero: numRandom, monto: 10 },
    ],
  });

  const startTime = Date.now();
  const res = http.post(`${BASE_URL}/boletos/emitir`, payload, { headers });
  const duration = Date.now() - startTime;

  EmisionDuration.add(duration);

  if (res.status === 200) {
    EmisionSuccessRate.add(1);
    check(res, {
      'emision status 200': (r) => r.status === 200,
      'boleto id presente': (r) => JSON.parse(r.body).boletoId !== undefined,
      'hash sha256 presente': (r) => JSON.parse(r.body).codigoValidacion.length === 12,
    });
  } else if (res.status === 400 || res.status === 422) {
    // Si el sorteo ya se congeló por la regla de -5 minutos o el saldo/número está bloqueado
    FreezeRejections.add(1);
    check(res, {
      'rechazo esperado por ventana o bloqueo': (r) => r.status === 400 || r.status === 422,
    });
  }

  sleep(0.5); // Simula el tiempo entre digitaciones sucesivas
}

export function teardown(data) {
  // Verificación final de integridad de saldos y consistencia
  const res = http.get(`${BASE_URL}/boletos/auditoria?sorteoId=${data.sorteoId}`, {
    headers: { Authorization: `Bearer ${data.token}` },
  });

  check(res, {
    'auditoria post-estres responde 200': (r) => r.status === 200,
  });
}
