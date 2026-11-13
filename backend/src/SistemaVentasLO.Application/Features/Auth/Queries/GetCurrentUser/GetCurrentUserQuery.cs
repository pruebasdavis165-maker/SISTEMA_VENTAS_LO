using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Auth.DTOs;
using SistemaVentasLO.Domain.Exceptions;

namespace SistemaVentasLO.Application.Features.Auth.Queries.GetCurrentUser;

public record GetCurrentUserQuery(Guid UserId) : IRequest<UserProfileDto>;

public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, UserProfileDto>
{
    private readonly IApplicationDbContext _context;

    public GetCurrentUserQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserProfileDto> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        var usuario = await _context.Usuarios
            .Include(u => u.Rol)
            .Include(u => u.Zona)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (usuario == null)
        {
            throw new DomainException("Usuario no encontrado.");
        }

        return new UserProfileDto(
            usuario.Id,
            usuario.Username,
            usuario.Cedula,
            usuario.Nombres,
            usuario.Apellidos,
            usuario.Rol.Nombre,
            usuario.ZonaId,
            usuario.Zona?.Nombre,
            usuario.Zona?.CoeficientePremio,
            usuario.SaldoCredito,
            usuario.PrecioBase,
            usuario.PrecioVenta
        );
    }
}
