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
    string Estado
);
