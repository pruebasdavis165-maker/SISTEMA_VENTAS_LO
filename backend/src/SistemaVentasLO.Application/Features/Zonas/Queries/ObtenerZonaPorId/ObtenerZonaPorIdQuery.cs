using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Zonas.DTOs;
using SistemaVentasLO.Domain.Exceptions;

namespace SistemaVentasLO.Application.Features.Zonas.Queries.ObtenerZonaPorId;

public record ObtenerZonaPorIdQuery(int Id) : IRequest<ZonaDto>;

public class ObtenerZonaPorIdQueryHandler : IRequestHandler<ObtenerZonaPorIdQuery, ZonaDto>
{
    private readonly IApplicationDbContext _context;

    public ObtenerZonaPorIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ZonaDto> Handle(ObtenerZonaPorIdQuery request, CancellationToken cancellationToken)
    {
        var zona = await _context.Zonas
            .Include(z => z.Usuarios)
            .AsNoTracking()
            .FirstOrDefaultAsync(z => z.Id == request.Id, cancellationToken);

        if (zona == null)
        {
            throw new DomainException($"No se encontró la zona comercial con ID {request.Id}.");
        }

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
