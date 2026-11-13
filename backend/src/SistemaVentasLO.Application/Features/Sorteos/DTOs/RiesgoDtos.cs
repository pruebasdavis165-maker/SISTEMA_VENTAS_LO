namespace SistemaVentasLO.Application.Features.Sorteos.DTOs;

public record NumeroCuadriculaDto(
    string Numero,
    decimal TotalVendido,
    int CantidadJugadas,
    decimal RiesgoEstimadoPremio,
    bool EstaBloqueado,
    string? AlcanceBloqueo,
    string? MotivoBloqueo
);

public record CuadriculaRiesgoGlobalDto(
    long SorteoId,
    string NombreSorteo,
    DateTime FechaHoraProgramada,
    string EstadoSorteo,
    decimal VentaTotalAcumulada,
    decimal RiesgoTotalEstimado,
    List<NumeroCuadriculaDto> Cuadricula
);

public record BloquearNumeroRequest(
    string Numero,
    string Alcance = "GLOBAL",
    int? ZonaId = null,
    Guid? VendedorId = null,
    string? Motivo = null
);

public record BloqueoNumeroDto(
    long Id,
    long SorteoId,
    string Numero,
    string Alcance,
    int? ZonaId,
    string? NombreZona,
    Guid? VendedorId,
    string? NombreVendedor,
    string? Motivo,
    DateTime CreatedAt
);
