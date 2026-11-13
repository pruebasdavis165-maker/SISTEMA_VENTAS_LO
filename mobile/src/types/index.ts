export interface UserSession {
  id: string;
  username: string;
  nombres: string;
  apellidos: string;
  rol: string;
  zonaId?: number;
  nombreZona?: string;
  precioBase: number;
  precioVenta: number;
  saldoCredito: number;
  coeficientePremio: number;
}

export interface SorteoActivo {
  id: number;
  codigo: string;
  fecha: string;
  horaCierre: string;
  minutosRestantes: number;
  bloqueadoParaVenta: boolean;
  estado: string;
}

export interface JugadaItem {
  id: string;
  numero: string;
  monto: number;
  premioPotencial: number;
}

export interface BoletoEmitido {
  id: number;
  numeroBoleto: string;
  codigoValidacion: string;
  sorteoCodigo: string;
  totalApostado: number;
  totalPremioEstimado: number;
  fechaEmision: string;
  estado: 'ACTIVO' | 'PREMIADO' | 'NO_PREMIADO' | 'ANULADO';
  copiasImpresas: number;
  jugadas: Array<{
    numero: string;
    monto: number;
    premioCalculado: number;
  }>;
}
