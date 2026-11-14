using System;
using System.Collections.Generic;

namespace SistemaVentasLO.Application.Features.Reportes.DTOs;

public record TopVendedorMetricasDto(
    Guid VendedorId,
    string Nombre,
    string Cedula,
    string ZonaNombre,
    decimal Ventas,
    int Boletos,
    decimal Comision,
    decimal Premios,
    decimal BalanceNeto,
    List<string> JugadasMasVendidas
);

public record ZonaRentabilidadMetricasDto(
    int ZonaId,
    string Nombre,
    string Coeficiente,
    decimal Ventas,
    decimal Premios,
    decimal Comisiones,
    decimal Utilidad,
    int VendedoresCount
);

public record DashboardReporteDto(
    decimal VentaTotal,
    decimal PremiosPagados,
    decimal ComisionesTotal,
    decimal UtilidadNeta,
    int TotalBoletos,
    int BoletosPremiados,
    int VendedoresActivos,
    int TotalVendedores,
    List<ZonaRentabilidadMetricasDto> DesgloseZonas,
    List<TopVendedorMetricasDto> TopVendedores
);
