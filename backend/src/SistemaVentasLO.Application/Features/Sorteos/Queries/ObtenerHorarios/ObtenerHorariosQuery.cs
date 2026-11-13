using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Sorteos.DTOs;

namespace SistemaVentasLO.Application.Features.Sorteos.Queries.ObtenerHorarios;

public record ObtenerHorariosQuery : IRequest<List<HorarioConfiguracionDto>>;

public class ObtenerHorariosQueryHandler : IRequestHandler<ObtenerHorariosQuery, List<HorarioConfiguracionDto>>
{
    private readonly IApplicationDbContext _context;

    public ObtenerHorariosQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<HorarioConfiguracionDto>> Handle(ObtenerHorariosQuery request, CancellationToken cancellationToken)
    {
        return await _context.HorariosConfiguracion
            .AsNoTracking()
            .OrderBy(h => h.HoraCierre)
            .Select(h => new HorarioConfiguracionDto(
                h.Id,
                h.Nombre,
                h.HoraCierre,
                h.DiasSemana,
                h.MinutosBloqueoPrevio,
                h.MinutosReaperturaPosterior,
                h.Activo
            ))
            .ToListAsync(cancellationToken);
    }
}
