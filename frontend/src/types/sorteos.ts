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
