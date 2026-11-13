namespace SistemaVentasLO.Application.Features.Vendedores.DTOs;

public record VendedorDto(
    Guid Id,
    string Cedula,
    string Nombres,
    string Apellidos,
    string? Celular,
    string? Direccion,
    string Username,
    int ZonaId,
    string ZonaNombre,
    decimal CoeficientePremio,
    decimal PrecioBase,
    decimal PrecioVenta,
    decimal SaldoCredito,
    bool Estado,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CrearVendedorRequest(
    string Cedula,
    string Nombres,
    string Apellidos,
    string? Celular,
    string? Direccion,
    string Username,
    string Password,
    int ZonaId,
    decimal PrecioBase,
    decimal PrecioVenta,
    decimal SaldoInicial
);

public record ActualizarVendedorRequest(
    string Cedula,
    string Nombres,
    string Apellidos,
    string? Celular,
    string? Direccion,
    int ZonaId,
    decimal PrecioBase,
    decimal PrecioVenta
);

public record RecargarSaldoRequest(
    decimal Monto,
    string? Concepto
);

public record ResetPasswordRequest(
    string NuevaPassword
);

public record CambiarEstadoVendedorRequest(
    bool Estado
);
