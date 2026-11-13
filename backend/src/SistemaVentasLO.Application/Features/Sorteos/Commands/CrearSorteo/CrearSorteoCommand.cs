using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Sorteos.DTOs;
using SistemaVentasLO.Domain.Entities;
using SistemaVentasLO.Domain.Exceptions;

namespace SistemaVentasLO.Application.Features.Sorteos.Commands.CrearSorteo;

public record CrearSorteoCommand(
    DateOnly Fecha,
    TimeSpan HoraCierre,
    int? ZonaId,
    int? HorarioConfiguracionId
) : IRequest<SorteoDto>;

public class CrearSorteoCommandValidator : AbstractValidator<CrearSorteoCommand>
{
    public CrearSorteoCommandValidator()
    {
        RuleFor(x => x.Fecha)
            .NotEmpty().WithMessage("La fecha del sorteo es obligatoria.");

        RuleFor(x => x.HoraCierre)
            .NotEmpty().WithMessage("La hora de cierre es obligatoria.");
    }
}

public class CrearSorteoCommandHandler : IRequestHandler<CrearSorteoCommand, SorteoDto>
{
    private readonly IApplicationDbContext _context;

    public CrearSorteoCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SorteoDto> Handle(CrearSorteoCommand request, CancellationToken cancellationToken)
    {
        var cierreDateTime = request.Fecha.ToDateTime(TimeOnly.FromTimeSpan(request.HoraCierre), DateTimeKind.Utc);

        var codigo = $"SRT-{request.Fecha:yyyyMMdd}-{request.HoraCierre:hhmm}";
        if (request.ZonaId.HasValue)
        {
            codigo += $"-Z{request.ZonaId.Value}";
        }

        var existe = await _context.Sorteos.AnyAsync(s => s.Codigo == codigo, cancellationToken);
        if (existe)
        {
            throw new DomainException($"Ya existe un sorteo programado con el código '{codigo}'.");
        }

        string? zonaNombre = null;
        if (request.ZonaId.HasValue)
        {
            var zona = await _context.Zonas.FirstOrDefaultAsync(z => z.Id == request.ZonaId.Value, cancellationToken);
            if (zona == null) throw new DomainException("La zona especificada no existe.");
            zonaNombre = zona.Nombre;
        }

        string? horarioNombre = null;
        if (request.HorarioConfiguracionId.HasValue)
        {
            var hc = await _context.HorariosConfiguracion.FirstOrDefaultAsync(h => h.Id == request.HorarioConfiguracionId.Value, cancellationToken);
            if (hc != null) horarioNombre = hc.Nombre;
        }

        var sorteo = new Sorteo
        {
            Codigo = codigo,
            Fecha = request.Fecha,
            HoraCierre = cierreDateTime,
            ZonaId = request.ZonaId,
            HorarioConfiguracionId = request.HorarioConfiguracionId,
            Estado = "ABIERTO",
            NumeroGanador = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Sorteos.Add(sorteo);
        await _context.SaveChangesAsync(cancellationToken);

        var ahora = DateTime.UtcNow;
        var ventanaBloqueo = sorteo.HoraCierre.AddMinutes(-5);
        var permiteVenta = sorteo.Estado == "ABIERTO" && ahora < ventanaBloqueo;
        var minutosRestantes = (int)Math.Max(0, (ventanaBloqueo - ahora).TotalMinutes);

        return new SorteoDto(
            sorteo.Id,
            sorteo.Codigo,
            sorteo.Fecha,
            sorteo.HoraCierre,
            sorteo.ZonaId,
            zonaNombre,
            sorteo.HorarioConfiguracionId,
            horarioNombre,
            sorteo.Estado,
            sorteo.NumeroGanador,
            permiteVenta,
            minutosRestantes,
            sorteo.CreatedAt,
            sorteo.UpdatedAt
        );
    }
}
