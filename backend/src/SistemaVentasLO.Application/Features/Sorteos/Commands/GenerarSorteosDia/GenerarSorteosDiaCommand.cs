using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Sorteos.DTOs;
using SistemaVentasLO.Domain.Entities;

namespace SistemaVentasLO.Application.Features.Sorteos.Commands.GenerarSorteosDia;

public record GenerarSorteosDiaCommand(DateOnly Fecha, int? ZonaId) : IRequest<List<SorteoDto>>;

public class GenerarSorteosDiaCommandHandler : IRequestHandler<GenerarSorteosDiaCommand, List<SorteoDto>>
{
    private readonly IApplicationDbContext _context;

    public GenerarSorteosDiaCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<SorteoDto>> Handle(GenerarSorteosDiaCommand request, CancellationToken cancellationToken)
    {
        var horarios = await _context.HorariosConfiguracion
            .Where(h => h.Activo)
            .OrderBy(h => h.HoraCierre)
            .ToListAsync(cancellationToken);

        var sorteosCreados = new List<SorteoDto>();
        var dayOfWeek = request.Fecha.DayOfWeek;
        var esMartes = dayOfWeek == DayOfWeek.Tuesday;

        foreach (var h in horarios)
        {
            // Si el horario es específico para martes y hoy no es martes, se omite
            if (h.DiasSemana.Contains("M") && !h.DiasSemana.Contains("L") && !esMartes)
            {
                continue;
            }

            var cierreDateTime = request.Fecha.ToDateTime(TimeOnly.FromTimeSpan(h.HoraCierre), DateTimeKind.Utc);
            var codigo = $"SRT-{request.Fecha:yyyyMMdd}-{h.HoraCierre:hhmm}";
            if (request.ZonaId.HasValue)
            {
                codigo += $"-Z{request.ZonaId.Value}";
            }

            var existe = await _context.Sorteos.AnyAsync(s => s.Codigo == codigo, cancellationToken);
            if (!existe)
            {
                var sorteo = new Sorteo
                {
                    Codigo = codigo,
                    Fecha = request.Fecha,
                    HoraCierre = cierreDateTime,
                    ZonaId = request.ZonaId,
                    HorarioConfiguracionId = h.Id,
                    Estado = "ABIERTO",
                    NumeroGanador = null,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Sorteos.Add(sorteo);
                await _context.SaveChangesAsync(cancellationToken);

                sorteosCreados.Add(new SorteoDto(
                    sorteo.Id,
                    sorteo.Codigo,
                    sorteo.Fecha,
                    sorteo.HoraCierre,
                    sorteo.ZonaId,
                    null,
                    h.Id,
                    h.Nombre,
                    sorteo.Estado,
                    sorteo.NumeroGanador,
                    true,
                    120,
                    sorteo.CreatedAt,
                    sorteo.UpdatedAt
                ));
            }
        }

        return sorteosCreados;
    }
}
