export interface HorarioConfiguracion {
  id: number;
  nombre: string;
  horaCierre: string;
  diasSemana: string;
  minutosBloqueoPrevio: number;
  minutosReaperturaPosterior: number;
  activo: boolean;
}

export interface Sorteo {
  id: number;
  codigo: string;
  fecha: string;
  horaCierre: string;
  zonaId: number | null;
  zonaNombre: string | null;
  horarioConfiguracionId: number | null;
  horarioNombre: string | null;
  estado: string;
  numeroGanador: string | null;
  permiteVenta: boolean;
  minutosRestantesVenta: number;
  createdAt: string;
  updatedAt: string;
}

export interface DesgloseVendedorSorteo {
  vendedorId: string;
  nombreVendedor: string;
  cedula: string;
  zonaNombre: string;
  boletosEmitidos: number;
  totalVendido: number;
  comisionGanada: number;
  premiosAsociados: number;
}

export interface TopNumeroJugado {
  numero: string;
  totalVendido: number;
  cantidadJugadas: number;
}

export interface SorteoDetalle {
  id: number;
  codigo: string;
  fecha: string;
  horaCierre: string;
  horarioNombre: string | null;
  estado: string;
  numeroGanador: string | null;
  ventaTotal: number;
  premioTotal: number;
  comisionesTotal: number;
  utilidadNeta: number;
  totalBoletos: number;
  desgloseVendedores: DesgloseVendedorSorteo[];
  topNumeros: TopNumeroJugado[];
}

export interface SorteoHistorial {
  id: number;
  codigo: string;
  fecha: string;
  horaCierre: string;
  horarioNombre: string | null;
  estado: string;
  numeroGanador: string | null;
  ventaTotal: number;
  premioTotal: number;
  comisionesTotal: number;
  utilidadNeta: number;
  totalBoletos: number;
  cantidadVendedores: number;
}
