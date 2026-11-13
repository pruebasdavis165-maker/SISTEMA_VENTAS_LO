using SistemaVentasLO.Domain.Entities;

namespace SistemaVentasLO.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(Usuario usuario);
}

public interface IPasswordHasher
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string passwordHash);
}
