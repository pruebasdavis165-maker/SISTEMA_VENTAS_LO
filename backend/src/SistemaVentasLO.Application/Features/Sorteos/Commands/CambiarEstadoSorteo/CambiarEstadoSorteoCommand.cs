using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Sorteos.DTOs;
using SistemaVentasLO.Domain.Exceptions;

namespace SistemaVentasLO.Application.Features.Sorteos.Commands.CambiarEstadoSorteo;

public record CambiarEstadoSorteoCommand(long SorteoId, string Estado) : IRequest<SorteoDto>;

public class CambiarEstadoSorteoCommandHandler : IRequestHandler<CambiarEstadoSorteoCommand, SorteoDto>
{
    private readonly IApplicationDbContext _context;

    public CambiarEstadoSorteoCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SorteoDto> Handle(CambiarEstadoSorteoCommand request, CancellationToken cancellationToken)
    {
        var sorteo = await _context.Sorteos
            .Include(s => s.Zona)
            .Include(s => s.HorarioConfiguracion)
            .FirstOrDefaultAsync(s => s.Id == request.SorteoId, cancellationToken);

        if (sorteo == null)
        {
            throw new DomainException($"No se encontró el sorteo con ID {request.SorteoId}.");
        }

        sorteo.Estado = request.Estado.ToUpper();
        sorteo.UpdatedAt = DateTime.UtcNow;

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
            sorteo.Zona?.Nombre,
            sorteo.HorarioConfiguracionId,
            sorteo.HorarioConfiguracion?.Nombre,
            sorteo.Estado,
            sorteo.NumeroGanador,
            permiteVenta,
            minutosRestantes,
            sorteo.CreatedAt,
            sorteo.UpdatedAt
        );
    }
}
