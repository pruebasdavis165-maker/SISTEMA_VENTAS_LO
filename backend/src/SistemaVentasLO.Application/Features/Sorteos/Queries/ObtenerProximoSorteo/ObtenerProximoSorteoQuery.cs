using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Sorteos.DTOs;

namespace SistemaVentasLO.Application.Features.Sorteos.Queries.ObtenerProximoSorteo;

public record ObtenerProximoSorteoQuery(int? ZonaId = null) : IRequest<SorteoDto?>;

public class ObtenerProximoSorteoQueryHandler : IRequestHandler<ObtenerProximoSorteoQuery, SorteoDto?>
{
    private readonly IApplicationDbContext _context;

    public ObtenerProximoSorteoQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SorteoDto?> Handle(ObtenerProximoSorteoQuery request, CancellationToken cancellationToken)
    {
        var ahora = DateTime.UtcNow;
        var margenMinimoVenta = ahora.AddMinutes(5); // Al menos 5 min antes del cierre

        var query = _context.Sorteos
            .Include(s => s.Zona)
            .Include(s => s.HorarioConfiguracion)
            .Where(s => s.Estado == "ABIERTO" && s.HoraCierre > margenMinimoVenta)
            .AsNoTracking();

        if (request.ZonaId.HasValue && request.ZonaId.Value > 0)
        {
            query = query.Where(s => s.ZonaId == request.ZonaId.Value || s.ZonaId == null);
        }

        var sorteo = await query
            .OrderBy(s => s.HoraCierre)
            .FirstOrDefaultAsync(cancellationToken);

        if (sorteo == null) return null;

        var ventanaBloqueo = sorteo.HoraCierre.AddMinutes(-5);
        var minutosRestantes = (int)Math.Max(0, (ventanaBloqueo - ahora).TotalMinutes);

        return new SorteoDto(
            sorteo.Id,
            sorteo.Codigo,
            sorteo.Fecha,
            sorteo.HoraCierre,
            sorteo.ZonaId,
            sorteo.Zona?.Nombre,
            sorteo.HorarioConfiguracionId,
            sorteo.HorarioConfiguracion?.Nombre,
            sorteo.Estado,
            sorteo.NumeroGanador,
            true,
            minutosRestantes,
            sorteo.CreatedAt,
            sorteo.UpdatedAt
        );
    }
}
