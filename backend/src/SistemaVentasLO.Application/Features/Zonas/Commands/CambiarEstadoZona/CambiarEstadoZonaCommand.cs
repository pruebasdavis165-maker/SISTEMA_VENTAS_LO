using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Zonas.DTOs;
using SistemaVentasLO.Domain.Exceptions;

namespace SistemaVentasLO.Application.Features.Zonas.Commands.CambiarEstadoZona;

public record CambiarEstadoZonaCommand(int Id, bool Estado) : IRequest<ZonaDto>;

public class CambiarEstadoZonaCommandHandler : IRequestHandler<CambiarEstadoZonaCommand, ZonaDto>
{
    private readonly IApplicationDbContext _context;

    public CambiarEstadoZonaCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ZonaDto> Handle(CambiarEstadoZonaCommand request, CancellationToken cancellationToken)
    {
        var zona = await _context.Zonas
            .Include(z => z.Usuarios)
            .FirstOrDefaultAsync(z => z.Id == request.Id, cancellationToken);

        if (zona == null)
        {
            throw new DomainException($"No se encontró la zona comercial con ID {request.Id}.");
        }

        zona.Estado = request.Estado;
        zona.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return new ZonaDto(
            zona.Id,
            zona.Nombre,
            zona.CoeficientePremio,
            zona.Estado,
            zona.CreatedAt,
            zona.UpdatedAt,
            zona.Usuarios.Count
        );
    }
}
