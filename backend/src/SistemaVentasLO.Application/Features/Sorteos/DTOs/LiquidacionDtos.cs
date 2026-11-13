namespace SistemaVentasLO.Application.Features.Sorteos.DTOs;

public record LiquidarSorteoRequest(
    string NumeroGanador
);

public record DetalleLiquidacionVendedorDto(
    Guid VendedorId,
    string CodigoVendedor,
    string NombreVendedor,
    string ZonaNombre,
    decimal VentaVendedor,
    decimal ComisionVendedor,
    decimal PremiosEnPunto,
    decimal BalanceNeto
);

public record LiquidacionSorteoDto(
    long Id,
    long SorteoId,
    string CodigoSorteo,
    string NumeroGanador,
    decimal VentaTotal,
    decimal PremioTotal,
    decimal DiferenciaBruta,
    decimal ComisionVendedoresTotal,
    decimal GananciaNetaEmpresa,
    DateTime FechaLiquidacion,
    List<DetalleLiquidacionVendedorDto> DesgloseVendedores
);
