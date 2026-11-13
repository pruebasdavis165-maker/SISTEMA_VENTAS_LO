namespace SistemaVentasLO.Application.Features.Auth.DTOs;

public record LoginRequest(string Username, string Password);

public record UserProfileDto(
    Guid Id,
    string Username,
    string Cedula,
    string Nombres,
    string Apellidos,
    string Rol,
    int? ZonaId,
    string? ZonaNombre,
    decimal? CoeficientePremio,
    decimal SaldoCredito,
    decimal PrecioBase,
    decimal PrecioVenta
);

public record LoginResponse(
    string AccessToken,
    string TokenType,
    int ExpiresInMinutes,
    UserProfileDto User
);
