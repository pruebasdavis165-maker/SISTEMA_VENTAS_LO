using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Reportes.DTOs;

namespace SistemaVentasLO.WebApi.Controllers;

[Authorize]
public class ReportesController : ApiControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardReporte(
        [FromQuery] DateOnly? fechaDesde,
        [FromQuery] DateOnly? fechaHasta,
        [FromQuery] int? zonaId,
        [FromQuery] Guid? vendedorId,
        [FromServices] IApplicationDbContext context)
    {
        var hoy = SistemaVentasLO.Domain.Common.NicaraguaDateTime.Today;
        var desde = fechaDesde ?? hoy;
        var hasta = fechaHasta ?? hoy;

        var startUtc = desde.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var endUtc = hasta.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);

        var boletosQuery = context.Boletos
            .Include(b => b.Vendedor)
            .Include(b => b.Zona)
            .Include(b => b.Sorteo)
            .Include(b => b.Jugadas)
            .Where(b => b.FechaEmision >= startUtc && b.FechaEmision <= endUtc && b.Estado == "ACTIVO")
            .AsNoTracking()
            .AsQueryable();

        if (zonaId.HasValue && zonaId.Value > 0)
        {
            boletosQuery = boletosQuery.Where(b => b.ZonaId == zonaId.Value);
        }

        if (vendedorId.HasValue)
        {
            boletosQuery = boletosQuery.Where(b => b.VendedorId == vendedorId.Value);
        }

        var boletos = await boletosQuery.ToListAsync();

        decimal ventaTotal = boletos.Sum(b => b.TotalApostado);
        decimal comisionesTotal = Math.Round(ventaTotal * 0.10m, 2);
        decimal premiosPagados = 0;
        int boletosPremiados = 0;

        foreach (var b in boletos)
        {
            if (b.Sorteo != null && !string.IsNullOrWhiteSpace(b.Sorteo.NumeroGanador))
            {
                var premiosBoleto = b.Jugadas
                    .Where(j => j.Numero == b.Sorteo.NumeroGanador)
                    .Sum(j => j.PremioCalculado);

                if (premiosBoleto > 0)
                {
                    premiosPagados += premiosBoleto;
                    boletosPremiados++;
                }
            }
        }

        decimal utilidadNeta = ventaTotal - premiosPagados - comisionesTotal;

        // Desglose de Zonas
        var todasLasZonas = await context.Zonas.Include(z => z.Usuarios).AsNoTracking().ToListAsync();
        var desgloseZonas = new List<ZonaRentabilidadMetricasDto>();

        foreach (var z in todasLasZonas)
        {
            var boletosZona = boletos.Where(b => b.ZonaId == z.Id).ToList();
            var ventaZona = boletosZona.Sum(b => b.TotalApostado);
            decimal premiosZona = 0;
            decimal comisionesZona = Math.Round(ventaZona * 0.10m, 2);

            foreach (var b in boletosZona)
            {
                if (b.Sorteo != null && !string.IsNullOrWhiteSpace(b.Sorteo.NumeroGanador))
                {
                    premiosZona += b.Jugadas
                        .Where(j => j.Numero == b.Sorteo.NumeroGanador)
                        .Sum(j => j.PremioCalculado);
                }
            }

            int vendedoresEnZona = z.Usuarios?.Count(u => u.RolId == 2 && u.Estado) ?? 0;

            desgloseZonas.Add(new ZonaRentabilidadMetricasDto(
                z.Id,
                z.Nombre,
                $"x{z.CoeficientePremio:0}",
                ventaZona,
                premiosZona,
                comisionesZona,
                ventaZona - premiosZona - comisionesZona,
                vendedoresEnZona
            ));
        }

        // Top Vendedores con métricas enriquecidas
        var todosLosVendedores = await context.Usuarios
            .Include(u => u.Zona)
            .Where(u => u.RolId == 2)
            .AsNoTracking()
            .ToListAsync();

        var topVendedores = new List<TopVendedorMetricasDto>();

        foreach (var v in todosLosVendedores)
        {
            var boletosVend = boletos.Where(b => b.VendedorId == v.Id).ToList();
            var ventaVend = boletosVend.Sum(b => b.TotalApostado);
            var comisionVend = Math.Round(ventaVend * 0.10m, 2);

            decimal premiosVend = 0;
            foreach (var b in boletosVend)
            {
                if (b.Sorteo != null && !string.IsNullOrWhiteSpace(b.Sorteo.NumeroGanador))
                {
                    premiosVend += b.Jugadas
                        .Where(j => j.Numero == b.Sorteo.NumeroGanador)
                        .Sum(j => j.PremioCalculado);
                }
            }

            var topJugadas = boletosVend.SelectMany(b => b.Jugadas)
                .GroupBy(j => j.Numero)
                .OrderByDescending(g => g.Sum(x => x.Monto))
                .Take(5)
                .Select(g => $"#{g.Key} (${g.Sum(x => x.Monto):0})")
                .ToList();

            var nombreCompleto = $"{v.Nombres} {v.Apellidos}".Trim();
            if (string.IsNullOrWhiteSpace(nombreCompleto)) nombreCompleto = v.Username;

            topVendedores.Add(new TopVendedorMetricasDto(
                v.Id,
                nombreCompleto,
                v.Cedula,
                v.Zona?.Nombre ?? "General",
                ventaVend,
                boletosVend.Count,
                comisionVend,
                premiosVend,
                ventaVend - premiosVend - comisionVend,
                topJugadas
            ));
        }

        int vendedoresActivos = todosLosVendedores.Count(v => v.Estado);
        int totalVendedores = todosLosVendedores.Count;

        var response = new DashboardReporteDto(
            ventaTotal,
            premiosPagados,
            comisionesTotal,
            utilidadNeta,
            boletos.Count,
            boletosPremiados,
            vendedoresActivos,
            totalVendedores,
            desgloseZonas,
            topVendedores.OrderByDescending(v => v.Ventas).ToList()
        );

        return Ok(response);
    }
}
