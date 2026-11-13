export interface NumeroCuadricula {
  numero: string;
  totalVendido: number;
  cantidadJugadas: number;
  riesgoEstimadoPremio: number;
  estaBloqueado: boolean;
  alcanceBloqueo?: string | null;
  motivoBloqueo?: string | null;
}

export interface CuadriculaRiesgoGlobal {
  sorteoId: number;
  nombreSorteo: string;
  fechaHoraProgramada: string;
  estadoSorteo: string;
  ventaTotalAcumulada: number;
  riesgoTotalEstimado: number;
  cuadricula: NumeroCuadricula[];
}

export interface BloquearNumeroRequest {
  numero: string;
  alcance: 'GLOBAL' | 'POR_ZONA' | 'POR_VENDEDOR';
  zonaId?: number;
  vendedorId?: string;
  motivo?: string;
}
