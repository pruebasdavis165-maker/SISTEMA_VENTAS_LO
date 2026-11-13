using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Boletos.DTOs;

namespace SistemaVentasLO.Application.Features.Boletos.Queries.AuditoriaBoletos;

public record AuditoriaBoletosQuery(
    string? NumeroBoleto = null,
    long? SorteoId = null,
    Guid? VendedorId = null,
    int? ZonaId = null,
    string? Estado = null,
    DateOnly? Fecha = null
) : IRequest<List<BoletoAuditoriaDto>>;

public class AuditoriaBoletosQueryHandler : IRequestHandler<AuditoriaBoletosQuery, List<BoletoAuditoriaDto>>
{
    private readonly IApplicationDbContext _context;

    public AuditoriaBoletosQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<BoletoAuditoriaDto>> Handle(AuditoriaBoletosQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Boletos
            .AsNoTracking()
            .Include(b => b.Vendedor)
            .Include(b => b.Sorteo)
            .Include(b => b.Zona)
            .Include(b => b.Jugadas)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.NumeroBoleto))
        {
            query = query.Where(b => b.NumeroBoleto.Contains(request.NumeroBoleto.Trim()));
        }

        if (request.SorteoId.HasValue)
        {
            query = query.Where(b => b.SorteoId == request.SorteoId.Value);
        }

        if (request.VendedorId.HasValue)
        {
            query = query.Where(b => b.VendedorId == request.VendedorId.Value);
        }

        if (request.ZonaId.HasValue)
        {
            query = query.Where(b => b.ZonaId == request.ZonaId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Estado))
        {
            query = query.Where(b => b.Estado == request.Estado);
        }

        if (request.Fecha.HasValue)
        {
            var start = request.Fecha.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            var end = request.Fecha.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
            query = query.Where(b => b.FechaEmision >= start && b.FechaEmision <= end);
        }

        var boletos = await query
            .OrderByDescending(b => b.FechaEmision)
            .Take(200) // Límite de seguridad
            .ToListAsync(cancellationToken);

        return boletos.Select(b => new BoletoAuditoriaDto(
            Id: b.Id,
            NumeroBoleto: b.NumeroBoleto,
            CodigoValidacion: b.CodigoValidacion,
            VendedorId: b.VendedorId,
            CodigoVendedor: b.Vendedor.Username,
            NombreVendedor: $"{b.Vendedor.Nombres} {b.Vendedor.Apellidos}",
            SorteoId: b.SorteoId,
            CodigoSorteo: b.Sorteo.Codigo,
            ZonaId: b.ZonaId,
            NombreZona: b.Zona.Nombre,
            TotalApostado: b.TotalApostado,
            TotalPremioEstimado: b.TotalPremioEstimado,
            Estado: b.Estado,
            CopiasImpresas: b.CopiasImpresas,
            FechaEmision: b.FechaEmision,
            FechaCaducidadCobro: b.FechaCaducidadCobro,
            Jugadas: b.Jugadas.Select(j => new JugadaBoletoDto(
                Id: j.Id,
                Numero: j.Numero,
                Monto: j.Monto,
                CoeficienteCongelado: j.CoeficienteCongelado,
                PremioCalculado: j.PremioCalculado,
                EsGanador: j.EsGanador
            )).ToList()
        )).ToList();
    }
}
