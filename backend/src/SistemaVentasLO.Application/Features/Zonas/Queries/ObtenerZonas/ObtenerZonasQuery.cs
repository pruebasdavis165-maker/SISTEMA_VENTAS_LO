using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Zonas.DTOs;
using SistemaVentasLO.Domain.Exceptions;

namespace SistemaVentasLO.Application.Features.Zonas.Queries.ObtenerZonas;

public record ObtenerZonasQuery(bool? SoloActivas = null) : IRequest<List<ZonaDto>>;

public class ObtenerZonasQueryHandler : IRequestHandler<ObtenerZonasQuery, List<ZonaDto>>
{
    private readonly IApplicationDbContext _context;

    public ObtenerZonasQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ZonaDto>> Handle(ObtenerZonasQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Zonas
            .Include(z => z.Usuarios)
            .AsNoTracking();

        if (request.SoloActivas.HasValue && request.SoloActivas.Value)
        {
            query = query.Where(z => z.Estado);
        }

        return await query
            .OrderBy(z => z.Nombre)
            .Select(z => new ZonaDto(
                z.Id,
                z.Nombre,
                z.CoeficientePremio,
                z.Estado,
                z.CreatedAt,
                z.UpdatedAt,
                z.Usuarios.Count
            ))
            .ToListAsync(cancellationToken);
    }
}
