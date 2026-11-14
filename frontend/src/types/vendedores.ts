export interface LimiteNumeroVendedor {
  numero: string; // "TODOS" o "00" a "99"
  limiteMonto: number;
}

export interface Vendedor {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  celular?: string;
  direccion?: string;
  username: string;
  zonaId: number;
  zonaNombre: string;
  coeficientePremio: number;
  porcentajeComision: number; // Porcentaje sobre ventas (ej: 10 para 10%)
  precioBase?: number;
  precioVenta?: number;
  saldoCredito?: number;
  limitadores?: LimiteNumeroVendedor[];
  estado: boolean;
  createdAt: string;
  updatedAt: string;
}
