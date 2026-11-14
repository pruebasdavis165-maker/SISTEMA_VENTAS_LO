using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Sorteos.DTOs;
using SistemaVentasLO.Domain.Exceptions;

namespace SistemaVentasLO.Application.Features.Sorteos.Queries.ObtenerCuadriculaGlobal;

public record ObtenerCuadriculaGlobalQuery(long SorteoId, int? ZonaId = null, Guid? VendedorId = null) 
    : IRequest<CuadriculaRiesgoGlobalDto>;

public class ObtenerCuadriculaGlobalQueryHandler : IRequestHandler<ObtenerCuadriculaGlobalQuery, CuadriculaRiesgoGlobalDto>
{
    private readonly IApplicationDbContext _context;

    public ObtenerCuadriculaGlobalQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CuadriculaRiesgoGlobalDto> Handle(ObtenerCuadriculaGlobalQuery request, CancellationToken cancellationToken)
    {
        var sorteo = await _context.Sorteos
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == request.SorteoId, cancellationToken);

        if (sorteo == null)
            throw new DomainException("Sorteo no encontrado");

        // Obtenemos bloqueos vigentes para el sorteo
        var bloqueosQuery = _context.BloqueosNumeros
            .AsNoTracking()
            .Where(b => b.SorteoId == request.SorteoId);

        if (request.ZonaId.HasValue)
        {
            bloqueosQuery = bloqueosQuery.Where(b => b.Alcance == "GLOBAL" || (b.Alcance == "POR_ZONA" && b.ZonaId == request.ZonaId.Value));
        }
        else if (request.VendedorId.HasValue)
        {
            var vendedor = await _context.Usuarios
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == request.VendedorId.Value, cancellationToken);
            var vZonaId = vendedor?.ZonaId;

            bloqueosQuery = bloqueosQuery.Where(b => 
                b.Alcance == "GLOBAL" || 
                (b.Alcance == "POR_VENDEDOR" && b.VendedorId == request.VendedorId.Value) ||
                (vZonaId.HasValue && b.Alcance == "POR_ZONA" && b.ZonaId == vZonaId.Value));
        }

        var bloqueos = await bloqueosQuery.ToListAsync(cancellationToken);
        var bloqueosDict = bloqueos
            .GroupBy(b => b.Numero)
            .ToDictionary(g => g.Key, g => g.First());

        // Consultamos las ventas acumuladas agrupadas por número 00-99
        var jugadasQuery = _context.DetalleJugadas
            .AsNoTracking()
            .Where(j => j.SorteoId == request.SorteoId && j.Boleto.Estado == "ACTIVO");

        if (request.ZonaId.HasValue)
        {
            jugadasQuery = jugadasQuery.Where(j => j.Boleto.ZonaId == request.ZonaId.Value);
        }

        if (request.VendedorId.HasValue)
        {
            jugadasQuery = jugadasQuery.Where(j => j.Boleto.VendedorId == request.VendedorId.Value);
        }

        var ventasAgrupadas = await jugadasQuery
            .GroupBy(j => j.Numero)
            .Select(g => new
            {
                Numero = g.Key,
                TotalVendido = g.Sum(x => x.Monto),
                CantidadJugadas = g.Count(),
                RiesgoPremio = g.Sum(x => x.PremioCalculado)
            })
            .ToListAsync(cancellationToken);

        var ventasDict = ventasAgrupadas.ToDictionary(v => v.Numero);

        // Generar cuadrícula completa obligatoria de 00 a 99
        var cuadricula = new List<NumeroCuadriculaDto>(100);
        decimal totalVentaAcumulada = 0;
        decimal totalRiesgoAcumulado = 0;

        for (int i = 0; i <= 99; i++)
        {
            string numStr = i.ToString("D2");
            decimal totalVendido = 0;
            int cantidadJugadas = 0;
            decimal riesgoEstimado = 0;

            if (ventasDict.TryGetValue(numStr, out var venta))
            {
                totalVendido = venta.TotalVendido;
                cantidadJugadas = venta.CantidadJugadas;
                riesgoEstimado = venta.RiesgoPremio;
                totalVentaAcumulada += totalVendido;
                totalRiesgoAcumulado += riesgoEstimado;
            }

            bool estaBloqueado = bloqueosDict.TryGetValue(numStr, out var bloqueo);
            decimal? montoLimite = estaBloqueado ? bloqueo!.MontoLimite : null;

            cuadricula.Add(new NumeroCuadriculaDto(
                Numero: numStr,
                TotalVendido: totalVendido,
                CantidadJugadas: cantidadJugadas,
                RiesgoEstimadoPremio: riesgoEstimado,
                EstaBloqueado: estaBloqueado,
                MontoLimite: montoLimite,
                AlcanceBloqueo: estaBloqueado ? bloqueo!.Alcance : null,
                MotivoBloqueo: estaBloqueado ? bloqueo!.Motivo : null
            ));
        }

        return new CuadriculaRiesgoGlobalDto(
            SorteoId: sorteo.Id,
            NombreSorteo: sorteo.Codigo,
            FechaHoraProgramada: sorteo.HoraCierre,
            EstadoSorteo: sorteo.Estado,
            VentaTotalAcumulada: totalVentaAcumulada,
            RiesgoTotalEstimado: totalRiesgoAcumulado,
            Cuadricula: cuadricula
        );
    }
}
