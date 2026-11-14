using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Sorteos.DTOs;

namespace SistemaVentasLO.Application.Features.Sorteos.Queries.ObtenerSorteos;

public record ObtenerSorteosQuery(
    DateOnly? Fecha = null,
    int? ZonaId = null,
    string? Estado = null
) : IRequest<List<SorteoDto>>;

public class ObtenerSorteosQueryHandler : IRequestHandler<ObtenerSorteosQuery, List<SorteoDto>>
{
    private readonly IApplicationDbContext _context;

    public ObtenerSorteosQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<SorteoDto>> Handle(ObtenerSorteosQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Sorteos
            .Include(s => s.Zona)
            .Include(s => s.HorarioConfiguracion)
            .AsNoTracking();

        if (request.Fecha.HasValue)
        {
            query = query.Where(s => s.Fecha == request.Fecha.Value);
        }

        if (request.ZonaId.HasValue && request.ZonaId.Value > 0)
        {
            query = query.Where(s => s.ZonaId == request.ZonaId.Value || s.ZonaId == null);
        }

        if (!string.IsNullOrWhiteSpace(request.Estado))
        {
            query = query.Where(s => s.Estado == request.Estado.ToUpper());
        }

        var ahora = DateTime.UtcNow;

        var items = await query
            .OrderBy(s => s.Fecha)
            .ThenBy(s => s.HoraCierre)
            .ToListAsync(cancellationToken);

        return items.Select(s =>
        {
            var ventanaBloqueo = s.HoraCierre.AddMinutes(-5);
            var permiteVenta = s.Estado == "ABIERTO" && ahora < ventanaBloqueo;
            var minutosRestantes = (int)Math.Max(0, (ventanaBloqueo - ahora).TotalMinutes);

            var estadoEfectivo = s.Estado;
            if (s.Estado != "LIQUIDADO" && s.Estado != "CANCELADO")
            {
                if (ahora >= s.HoraCierre)
                {
                    estadoEfectivo = "CERRADO_PENDIENTE_GANADOR";
                }
                else if (ahora >= ventanaBloqueo)
                {
                    estadoEfectivo = "BLOQUEADO_VENTA";
                }
            }

            return new SorteoDto(
                s.Id,
                s.Codigo,
                s.Fecha,
                s.HoraCierre,
                s.ZonaId,
                s.Zona?.Nombre,
                s.HorarioConfiguracionId,
                s.HorarioConfiguracion?.Nombre,
                estadoEfectivo,
                s.NumeroGanador,
                permiteVenta,
                minutosRestantes,
                s.CreatedAt,
                s.UpdatedAt
            );
        }).ToList();
    }
}
