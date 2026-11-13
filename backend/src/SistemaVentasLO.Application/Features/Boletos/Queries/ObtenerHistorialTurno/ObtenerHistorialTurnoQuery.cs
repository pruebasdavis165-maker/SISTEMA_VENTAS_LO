using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;

namespace SistemaVentasLO.Application.Features.Boletos.Queries.ObtenerHistorialTurno;

public record JugadaResumenDto(string Numero, decimal Monto, decimal PremioCalculado);

public record BoletoHistorialDto(
    long Id,
    string NumeroBoleto,
    string CodigoValidacion,
    long SorteoId,
    string CodigoSorteo,
    decimal TotalApostado,
    decimal TotalPremioEstimado,
    string Estado,
    DateTime FechaEmision,
    bool PuedeAnularse,
    List<JugadaResumenDto> Jugadas
);

public record TopNumeroVendidoDto(string Numero, decimal TotalVendido, int CantidadJugadas);

public record ResumenTurnoResponse(
    decimal TotalVendidoTurno,
    decimal ComisionesGanadas,
    decimal SaldoOperativoActual,
    int TotalBoletosEmitidos,
    int TotalBoletosAnulados,
    List<TopNumeroVendidoDto> CuadriculaPersonal,
    List<BoletoHistorialDto> Boletos
);

public record ObtenerHistorialTurnoQuery(Guid VendedorId) : IRequest<ResumenTurnoResponse>;

public class ObtenerHistorialTurnoQueryHandler : IRequestHandler<ObtenerHistorialTurnoQuery, ResumenTurnoResponse>
{
    private readonly IApplicationDbContext _context;

    public ObtenerHistorialTurnoQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ResumenTurnoResponse> Handle(ObtenerHistorialTurnoQuery request, CancellationToken cancellationToken)
    {
        var vendedor = await _context.Usuarios
            .Include(u => u.Zona)
            .FirstOrDefaultAsync(u => u.Id == request.VendedorId, cancellationToken);

        if (vendedor == null)
        {
            throw new InvalidOperationException("Vendedor no encontrado.");
        }

        var inicioDia = DateTime.UtcNow.Date;
        var boletos = await _context.Boletos
            .Include(b => b.Sorteo)
            .Include(b => b.Jugadas)
            .Where(b => b.VendedorId == request.VendedorId && b.FechaEmision >= inicioDia)
            .OrderByDescending(b => b.FechaEmision)
            .ToListAsync(cancellationToken);

        var boletosActivos = boletos.Where(b => b.Estado == "ACTIVO").ToList();
        var totalVendidoTurno = boletosActivos.Sum(b => b.TotalApostado);

        // Comisión del vendedor: cálculo basado en precio base vs precio venta o porcentaje estándar del 10%
        decimal porcentajeComision = 0.10m;
        if (vendedor.PrecioVenta > 0 && vendedor.PrecioBase > 0 && vendedor.PrecioVenta > vendedor.PrecioBase)
        {
            porcentajeComision = (vendedor.PrecioVenta - vendedor.PrecioBase) / vendedor.PrecioVenta;
        }
        var comisionesGanadas = Math.Round(totalVendidoTurno * porcentajeComision, 2);

        // Cuadrícula personal: Top números vendidos en el turno
        var jugadasActivas = boletosActivos.SelectMany(b => b.Jugadas);
        var cuadriculaPersonal = jugadasActivas
            .GroupBy(j => j.Numero)
            .Select(g => new TopNumeroVendidoDto(
                g.Key,
                g.Sum(j => j.Monto),
                g.Count()
            ))
            .OrderByDescending(t => t.TotalVendido)
            .Take(10)
            .ToList();

        var ahoraUtc = DateTime.UtcNow;
        var listaBoletosDto = boletos.Select(b =>
        {
            var minutosDesdeEmision = (ahoraUtc - b.FechaEmision).TotalMinutes;
            var minutosParaCierreSorteo = (b.Sorteo.HoraCierre - ahoraUtc).TotalMinutes;
            var puedeAnularse = b.Estado == "ACTIVO" 
                                && minutosDesdeEmision <= 5 
                                && b.Sorteo.Estado == "ABIERTO" 
                                && minutosParaCierreSorteo > 5;

            return new BoletoHistorialDto(
                b.Id,
                b.NumeroBoleto,
                b.CodigoValidacion,
                b.SorteoId,
                b.Sorteo.Codigo,
                b.TotalApostado,
                b.TotalPremioEstimado,
                b.Estado,
                b.FechaEmision,
                puedeAnularse,
                b.Jugadas.Select(j => new JugadaResumenDto(j.Numero, j.Monto, j.PremioCalculado)).ToList()
            );
        }).ToList();

        return new ResumenTurnoResponse(
            totalVendidoTurno,
            comisionesGanadas,
            vendedor.SaldoCredito,
            boletos.Count,
            boletos.Count(b => b.Estado == "ANULADO"),
            cuadriculaPersonal,
            listaBoletosDto
        );
    }
}
