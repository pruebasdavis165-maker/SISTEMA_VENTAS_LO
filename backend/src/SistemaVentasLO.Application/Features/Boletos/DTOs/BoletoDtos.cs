namespace SistemaVentasLO.Application.Features.Boletos.DTOs;

public record JugadaBoletoDto(
    long Id,
    string Numero,
    decimal Monto,
    decimal CoeficienteCongelado,
    decimal PremioCalculado,
    bool EsGanador
);

public record BoletoAuditoriaDto(
    long Id,
    string NumeroBoleto,
    string CodigoValidacion,
    Guid VendedorId,
    string CodigoVendedor,
    string NombreVendedor,
    long SorteoId,
    string CodigoSorteo,
    int ZonaId,
    string NombreZona,
    decimal TotalApostado,
    decimal TotalPremioEstimado,
    string Estado,
    int CopiasImpresas,
    DateTime FechaEmision,
    DateTime? FechaCaducidadCobro,
    List<JugadaBoletoDto> Jugadas
);

public record ReimprimirBoletoResponse(
    long BoletoId,
    string NumeroBoleto,
    int TotalCopias,
    string MarcaAguaCopia, // Ej: "COPIA 1", "COPIA 2"
    DateTime FechaReimpresion
);
