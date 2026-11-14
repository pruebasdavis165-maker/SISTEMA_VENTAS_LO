namespace SistemaVentasLO.Application.Features.Sorteos.DTOs;

public record HorarioConfiguracionDto(
    int Id,
    string Nombre,
    TimeSpan HoraCierre,
    string DiasSemana,
    int MinutosBloqueoPrevio,
    int MinutosReaperturaPosterior,
    bool Activo
);

public record SorteoDto(
    long Id,
    string Codigo,
    DateOnly Fecha,
    DateTime HoraCierre,
    int? ZonaId,
    string? ZonaNombre,
    int? HorarioConfiguracionId,
    string? HorarioNombre,
    string Estado,
    string? NumeroGanador,
    bool PermiteVenta,
    int MinutosRestantesVenta,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CrearSorteoRequest(
    DateOnly Fecha,
    TimeSpan HoraCierre,
    int? ZonaId,
    int? HorarioConfiguracionId
);

public record GenerarSorteosDiaRequest(
    DateOnly Fecha,
    int? ZonaId
);

public record CambiarEstadoSorteoRequest(
    string? Estado = null,
    string? NuevoEstado = null
)
{
    public string ObtenerEstado() => !string.IsNullOrWhiteSpace(Estado) ? Estado : (!string.IsNullOrWhiteSpace(NuevoEstado) ? NuevoEstado : "ABIERTO");
};

public record DesgloseVendedorSorteoDto(
    Guid VendedorId,
    string NombreVendedor,
    string Cedula,
    string ZonaNombre,
    int BoletosEmitidos,
    decimal TotalVendido,
    decimal ComisionGanada,
    decimal PremiosAsociados
);

public record TopNumeroJugadoDto(
    string Numero,
    decimal TotalVendido,
    int CantidadJugadas
);

public record SorteoDetalleDto(
    long Id,
    string Codigo,
    DateOnly Fecha,
    DateTime HoraCierre,
    string? HorarioNombre,
    string Estado,
    string? NumeroGanador,
    decimal VentaTotal,
    decimal PremioTotal,
    decimal ComisionesTotal,
    decimal UtilidadNeta,
    int TotalBoletos,
    List<DesgloseVendedorSorteoDto> DesgloseVendedores,
    List<TopNumeroJugadoDto> TopNumeros
);

public record SorteoHistorialDto(
    long Id,
    string Codigo,
    DateOnly Fecha,
    DateTime HoraCierre,
    string? HorarioNombre,
    string Estado,
    string? NumeroGanador,
    decimal VentaTotal,
    decimal PremioTotal,
    decimal ComisionesTotal,
    decimal UtilidadNeta,
    int TotalBoletos,
    int CantidadVendedores
);
