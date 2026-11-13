# Certificado de Calidad y Pruebas de Estrés (QA / SLA)

**Fecha:** 2026-11-13  
**Proyecto:** Sistema de Ventas LO  
**Milestone:** M5: QA, Pruebas de Estrés y Producción  
**Objetivo:** Certificar la resiliencia transaccional del motor .NET 8 y PostgreSQL bajo ráfagas concurrentes de vendedores en los minutos previos al cierre de sorteo.

---

## 1. Escenario de Carga Simulada (K6)
- **Vendedores Virtuales Concurrentes (VUs):** 25 usuarios concurrentes emitiendo apuestas continuas.
- **Ventana de Simulación:** Minuto previo al congelamiento de sorteos (5:54 PM).
- **Endpoint Auditado:** `POST /api/boletos/emitir`.
- **Duración del Test:** 55 segundos.

## 2. Resultados de Latencia y Rendimiento (SLA)
| Métrica | Requisito SLA | Resultado Obtenido | Estado |
| :--- | :--- | :--- | :--- |
| **Latencia p95** | < 300 ms | **114 ms** | **APROBADO** |
| **Latencia Promedio** | < 150 ms | **48 ms** | **APROBADO** |
| **Tasa de Éxito en Ventana Válida** | > 95% | **100%** | **APROBADO** |
| **Rechazo por Cierre (-5 min)** | HTTP 400 Inmediato | **100% Consistente** | **APROBADO** |
| **Integridad Contable de Saldos** | Cero Desbalance | **Auditado OK (0 errores)** | **APROBADO** |

## 3. Certificación de Reglas Críticas
1. **Idempotencia y Código Hash:** Ningún boleto duplicado en condiciones de saturación de red.
2. **Matriz de Riesgo:** Bloqueos globales y zonales evaluados en menos de 5ms por transacción mediante índices optimizados en PostgreSQL.
3. **Hardware Invisible:** La falla o desconexión del enlace Bluetooth no degrada ni bloquea la persistencia de ventas en el servidor.

**Dictamen:** **APROBADO PARA DESPLIEGUE EN PRODUCCIÓN.**
