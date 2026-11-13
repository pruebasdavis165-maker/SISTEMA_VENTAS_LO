export interface JugadaBoleto {
  id: number;
  numero: string;
  monto: number;
  coeficienteCongelado: number;
  premioCalculado: number;
  esGanador: boolean;
}

export interface BoletoAuditoria {
  id: number;
  numeroBoleto: string;
  codigoValidacion: string;
  vendedorId: string;
  codigoVendedor: string;
  nombreVendedor: string;
  sorteoId: number;
  codigoSorteo: string;
  zonaId: number;
  nombreZona: string;
  totalApostado: number;
  totalPremioEstimado: number;
  estado: string;
  copiasImpresas: number;
  fechaEmision: string;
  fechaCaducidadCobro?: string | null;
  jugadas: JugadaBoleto[];
}

export interface ReimprimirBoletoResponse {
  boletoId: number;
  numeroBoleto: string;
  totalCopias: number;
  marcaAguaCopia: string;
  fechaReimpresion: string;
}
