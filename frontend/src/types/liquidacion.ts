export interface DetalleLiquidacionVendedor {
  vendedorId: string;
  codigoVendedor: string;
  nombreVendedor: string;
  zonaNombre: string;
  ventaVendedor: number;
  comisionVendedor: number;
  premiosEnPunto: number;
  balanceNeto: number;
}

export interface LiquidacionSorteo {
  id: number;
  sorteoId: number;
  codigoSorteo: string;
  numeroGanador: string;
  ventaTotal: number;
  premioTotal: number;
  diferenciaBruta: number;
  comisionVendedoresTotal: number;
  gananciaNetaEmpresa: number;
  fechaLiquidacion: string;
  desgloseVendedores: DetalleLiquidacionVendedor[];
}
