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
  precioBase: number;
  precioVenta: number;
  saldoCredito: number;
  estado: boolean;
  createdAt: string;
  updatedAt: string;
}
