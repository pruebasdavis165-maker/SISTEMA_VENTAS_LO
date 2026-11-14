export interface TopVendedorMetricas {
  vendedorId: string;
  nombre: string;
  cedula: string;
  zonaNombre: string;
  ventas: number;
  boletos: number;
  comision: number;
  premios: number;
  balanceNeto: number;
  jugadasMasVendidas: string[];
}

export interface ZonaRentabilidadMetricas {
  zonaId: number;
  nombre: string;
  coeficiente: string;
  ventas: number;
  premios: number;
  comisiones: number;
  utilidad: number;
  vendedoresCount: number;
}

export interface DashboardReporte {
  ventaTotal: number;
  premiosPagados: number;
  comisionesTotal: number;
  utilidadNeta: number;
  totalBoletos: number;
  boletosPremiados: number;
  vendedoresActivos: number;
  totalVendedores: number;
  desgloseZonas: ZonaRentabilidadMetricas[];
  topVendedores: TopVendedorMetricas[];
}
