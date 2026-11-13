using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Sorteos.DTOs;
using SistemaVentasLO.Domain.Exceptions;

namespace SistemaVentasLO.Application.Features.Sorteos.Queries.ObtenerLiquidacionSorteo;

public record ObtenerLiquidacionSorteoQuery(long SorteoId) : IRequest<LiquidacionSorteoDto>;

public class ObtenerLiquidacionSorteoQueryHandler : IRequestHandler<ObtenerLiquidacionSorteoQuery, LiquidacionSorteoDto>
{
    private readonly IApplicationDbContext _context;

    public ObtenerLiquidacionSorteoQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<LiquidacionSorteoDto> Handle(ObtenerLiquidacionSorteoQuery request, CancellationToken cancellationToken)
    {
        var liquidacion = await _context.Liquidaciones
            .AsNoTracking()
            .Include(l => l.Sorteo)
            .Include(l => l.DetalleVendedores)
                .ThenInclude(d => d.Vendedor)
                    .ThenInclude(v => v.Zona)
            .FirstOrDefaultAsync(l => l.SorteoId == request.SorteoId, cancellationToken);

        if (liquidacion == null)
            throw new DomainException("El sorteo aún no cuenta con liquidación registrada.");

        var desglose = liquidacion.DetalleVendedores.Select(d => new DetalleLiquidacionVendedorDto(
            VendedorId: d.VendedorId,
            CodigoVendedor: d.Vendedor.Username,
            NombreVendedor: $"{d.Vendedor.Nombres} {d.Vendedor.Apellidos}",
            ZonaNombre: d.Vendedor.Zona?.Nombre ?? "Sin Zona",
            VentaVendedor: d.VentaVendedor,
            ComisionVendedor: d.ComisionVendedor,
            PremiosEnPunto: d.PremiosEnPunto,
            BalanceNeto: d.BalanceNeto
        )).ToList();

        return new LiquidacionSorteoDto(
            Id: liquidacion.Id,
            SorteoId: liquidacion.SorteoId,
            CodigoSorteo: liquidacion.Sorteo.Codigo,
            NumeroGanador: liquidacion.NumeroGanador,
            VentaTotal: liquidacion.VentaTotal,
            PremioTotal: liquidacion.PremioTotal,
            DiferenciaBruta: liquidacion.DiferenciaBruta,
            ComisionVendedoresTotal: liquidacion.ComisionVendedoresTotal,
            GananciaNetaEmpresa: liquidacion.GananciaNetaEmpresa,
            FechaLiquidacion: liquidacion.FechaLiquidacion,
            DesgloseVendedores: desglose
        );
    }
}
