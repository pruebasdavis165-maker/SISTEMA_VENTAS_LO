namespace SistemaVentasLO.Application.Features.Zonas.DTOs;

public record ZonaDto(
    int Id,
    string Nombre,
    decimal CoeficientePremio,
    bool Estado,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    int CantidadVendedores
);

public record CrearZonaRequest(
    string Nombre,
    decimal CoeficientePremio
);

public record ActualizarZonaRequest(
    string Nombre,
    decimal CoeficientePremio,
    bool? Estado = null
);

public record CambiarEstadoZonaRequest(
    bool Estado
);
