using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Sorteos.Commands.BloquearNumero;
using SistemaVentasLO.Application.Features.Sorteos.Commands.CambiarEstadoSorteo;
using SistemaVentasLO.Application.Features.Sorteos.Commands.CrearSorteo;
using SistemaVentasLO.Application.Features.Sorteos.Commands.DesbloquearNumero;
using SistemaVentasLO.Application.Features.Sorteos.Commands.GenerarSorteosDia;
using SistemaVentasLO.Application.Features.Sorteos.Commands.LiquidarSorteo;
using SistemaVentasLO.Application.Features.Sorteos.DTOs;
using SistemaVentasLO.Application.Features.Sorteos.Queries.ObtenerCuadriculaGlobal;
using SistemaVentasLO.Application.Features.Sorteos.Queries.ObtenerHorarios;
using SistemaVentasLO.Application.Features.Sorteos.Queries.ObtenerLiquidacionSorteo;
using SistemaVentasLO.Application.Features.Sorteos.Queries.ObtenerProximoSorteo;
using SistemaVentasLO.Application.Features.Sorteos.Queries.ObtenerSorteos;

namespace SistemaVentasLO.WebApi.Controllers;

public class SorteosController : ApiControllerBase
{
    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(List<SorteoDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] DateOnly? fecha,
        [FromQuery] int? zonaId,
        [FromQuery] string? estado)
    {
        var result = await Mediator.Send(new ObtenerSorteosQuery(fecha, zonaId, estado));
        return Ok(result);
    }

    [HttpGet("proximo")]
    [Authorize]
    [ProducesResponseType(typeof(SorteoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> GetProximo([FromQuery] int? zonaId)
    {
        var result = await Mediator.Send(new ObtenerProximoSorteoQuery(zonaId));
        if (result == null) return NoContent();
        return Ok(result);
    }

    [HttpGet("horarios")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(List<HorarioConfiguracionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHorarios()
    {
        var result = await Mediator.Send(new ObtenerHorariosQuery());
        return Ok(result);
    }

    [HttpPost("horarios")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(HorarioConfiguracionDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CrearHorario(
        [FromBody] CrearHorarioConfigRequest request,
        [FromServices] IApplicationDbContext context)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre))
            return BadRequest(new { detail = "El nombre del horario no puede estar vacío." });

        var nuevo = new SistemaVentasLO.Domain.Entities.HorarioConfiguracion
        {
            Nombre = request.Nombre.Trim(),
            HoraCierre = request.HoraCierre,
            DiasSemana = string.IsNullOrWhiteSpace(request.DiasSemana) ? "L,M,X,J,V,S,D" : request.DiasSemana.Trim(),
            MinutosBloqueoPrevio = request.MinutosBloqueoPrevio > 0 ? request.MinutosBloqueoPrevio : 5,
            MinutosReaperturaPosterior = request.MinutosReaperturaPosterior > 0 ? request.MinutosReaperturaPosterior : 10,
            Activo = request.Activo,
            CreatedAt = DateTime.UtcNow
        };

        context.HorariosConfiguracion.Add(nuevo);
        await context.SaveChangesAsync(default);

        var dto = new HorarioConfiguracionDto(
            nuevo.Id,
            nuevo.Nombre,
            nuevo.HoraCierre,
            nuevo.DiasSemana,
            nuevo.MinutosBloqueoPrevio,
            nuevo.MinutosReaperturaPosterior,
            nuevo.Activo
        );

        return StatusCode(StatusCodes.Status201Created, dto);
    }

    [HttpPut("horarios/{id:int}")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(HorarioConfiguracionDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ActualizarHorario(
        int id,
        [FromBody] ActualizarHorarioConfigRequest request,
        [FromServices] IApplicationDbContext context)
    {
        var h = await context.HorariosConfiguracion.FirstOrDefaultAsync(x => x.Id == id);
        if (h == null)
            return NotFound(new { detail = "Horario no encontrado." });

        if (!string.IsNullOrWhiteSpace(request.Nombre))
            h.Nombre = request.Nombre.Trim();

        h.HoraCierre = request.HoraCierre;
        if (!string.IsNullOrWhiteSpace(request.DiasSemana))
            h.DiasSemana = request.DiasSemana.Trim();

        h.MinutosBloqueoPrevio = request.MinutosBloqueoPrevio > 0 ? request.MinutosBloqueoPrevio : 5;
        h.MinutosReaperturaPosterior = request.MinutosReaperturaPosterior > 0 ? request.MinutosReaperturaPosterior : 10;
        h.Activo = request.Activo;

        await context.SaveChangesAsync(default);

        var dto = new HorarioConfiguracionDto(
            h.Id,
            h.Nombre,
            h.HoraCierre,
            h.DiasSemana,
            h.MinutosBloqueoPrevio,
            h.MinutosReaperturaPosterior,
            h.Activo
        );

        return Ok(dto);
    }

    [HttpPatch("horarios/{id:int}/toggle")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(HorarioConfiguracionDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ToggleHorario(
        int id,
        [FromServices] IApplicationDbContext context)
    {
        var h = await context.HorariosConfiguracion.FirstOrDefaultAsync(x => x.Id == id);
        if (h == null)
            return NotFound(new { detail = "Horario no encontrado." });

        h.Activo = !h.Activo;
        await context.SaveChangesAsync(default);

        var dto = new HorarioConfiguracionDto(
            h.Id,
            h.Nombre,
            h.HoraCierre,
            h.DiasSemana,
            h.MinutosBloqueoPrevio,
            h.MinutosReaperturaPosterior,
            h.Activo
        );

        return Ok(dto);
    }

    [HttpDelete("horarios/{id:int}")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> EliminarHorario(
        int id,
        [FromServices] IApplicationDbContext context)
    {
        var h = await context.HorariosConfiguracion.FirstOrDefaultAsync(x => x.Id == id);
        if (h == null)
            return NotFound(new { detail = "Horario no encontrado." });

        var tieneSorteos = await context.Sorteos.AnyAsync(s => s.HorarioConfiguracionId == id);
        if (tieneSorteos)
        {
            h.Activo = false;
            await context.SaveChangesAsync(default);
            return Ok(new { Mensaje = "Horario desactivado para no afectar sorteos anteriores." });
        }

        context.HorariosConfiguracion.Remove(h);
        await context.SaveChangesAsync(default);
        return Ok(new { Mensaje = "Horario eliminado exitosamente." });
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(SorteoDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Create([FromBody] CrearSorteoRequest request)
    {
        var result = await Mediator.Send(new CrearSorteoCommand(
            request.Fecha,
            request.HoraCierre,
            request.ZonaId,
            request.HorarioConfiguracionId
        ));

        return Ok(result);
    }

    [HttpPost("generar-dia")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(List<SorteoDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GenerarDia([FromBody] GenerarSorteosDiaRequest request)
    {
        var result = await Mediator.Send(new GenerarSorteosDiaCommand(request.Fecha, request.ZonaId));
        return Ok(result);
    }

    [HttpPatch("{id:long}/estado")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(SorteoDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ChangeState(long id, [FromBody] CambiarEstadoSorteoRequest request)
    {
        var result = await Mediator.Send(new CambiarEstadoSorteoCommand(id, request.ObtenerEstado()));
        return Ok(result);
    }

    [HttpGet("{id:long}/cuadricula-global")]
    [Authorize]
    [ProducesResponseType(typeof(CuadriculaRiesgoGlobalDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCuadriculaGlobal(
        long id,
        [FromQuery] int? zonaId,
        [FromQuery] Guid? vendedorId)
    {
        var result = await Mediator.Send(new ObtenerCuadriculaGlobalQuery(id, zonaId, vendedorId));
        return Ok(result);
    }

    [HttpPost("{id:long}/bloquear-numero")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(long), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> BloquearNumero(long id, [FromBody] BloquearNumeroRequest request)
    {
        var idClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                      ?? User.FindFirst("sub")?.Value;
        Guid.TryParse(idClaim, out var adminId);

        var result = await Mediator.Send(new BloquearNumeroCommand(
            id,
            request.Numero,
            request.Alcance,
            request.ZonaId,
            request.VendedorId,
            request.MontoLimite,
            request.Motivo,
            adminId
        ));
        return Ok(new { BloqueoId = result, Mensaje = $"Límite/bloqueo para el número {request.Numero} configurado exitosamente." });
    }

    [HttpDelete("{id:long}/desbloquear-numero/{numero}")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DesbloquearNumero(
        long id, 
        string numero, 
        [FromQuery] string? alcance,
        [FromQuery] Guid? vendedorId,
        [FromQuery] int? zonaId)
    {
        await Mediator.Send(new DesbloquearNumeroCommand(id, numero, alcance, vendedorId, zonaId));
        return Ok(new { Mensaje = $"Número {numero} desbloqueado exitosamente." });
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> EliminarSorteo(
        long id,
        [FromServices] IApplicationDbContext context)
    {
        var sorteo = await context.Sorteos
            .Include(s => s.Boletos)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (sorteo == null)
            return NotFound(new { detail = "Sorteo no encontrado." });

        if (sorteo.Estado == "LIQUIDADO")
            return BadRequest(new { detail = "No se puede eliminar un sorteo ya liquidado y oficializado." });

        if (sorteo.Boletos.Any(b => b.Estado == "ACTIVO"))
        {
            sorteo.Estado = "CANCELADO";
            sorteo.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync(default);
            return Ok(new { Mensaje = "El sorteo tenía ventas registradas y ha sido CANCELADO para mantener trazabilidad." });
        }

        var bloqueos = await context.BloqueosNumeros.Where(b => b.SorteoId == id).ToListAsync();
        if (bloqueos.Any())
        {
            context.BloqueosNumeros.RemoveRange(bloqueos);
        }

        context.Sorteos.Remove(sorteo);
        await context.SaveChangesAsync(default);
        return Ok(new { Mensaje = "Sorteo eliminado exitosamente." });
    }

    [HttpPost("{id:long}/liquidar")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(LiquidacionSorteoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> LiquidarSorteo(long id, [FromBody] LiquidarSorteoRequest request)
    {
        var idClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                      ?? User.FindFirst("sub")?.Value;
        Guid.TryParse(idClaim, out var adminId);

        var result = await Mediator.Send(new LiquidarSorteoCommand(id, request.NumeroGanador, adminId));
        return Ok(result);
    }

    [HttpGet("{id:long}/liquidacion")]
    [Authorize]
    [ProducesResponseType(typeof(LiquidacionSorteoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLiquidacion(long id)
    {
        var result = await Mediator.Send(new ObtenerLiquidacionSorteoQuery(id));
        return Ok(result);
    }

    [HttpGet("{id:long}/detalle")]
    [Authorize]
    [ProducesResponseType(typeof(SorteoDetalleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDetalle(long id, [FromServices] SistemaVentasLO.Application.Common.Interfaces.IApplicationDbContext context)
    {
        var sorteo = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
            context.Sorteos
                .Include(s => s.HorarioConfiguracion)
                .Include(s => s.Zona),
            s => s.Id == id
        );

        if (sorteo == null) return NotFound("Sorteo no encontrado");

        var boletos = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(
            context.Boletos
                .Include(b => b.Vendedor)
                .Include(b => b.Zona)
                .Include(b => b.Jugadas)
                .Where(b => b.SorteoId == id && b.Estado == "ACTIVO")
        );

        decimal totalVentas = boletos.Sum(b => b.TotalApostado);
        decimal totalPremios = 0;
        decimal totalComisiones = 0;

        var desgloseVendedores = new List<DesgloseVendedorSorteoDto>();

        var boletosPorVendedor = boletos.GroupBy(b => b.VendedorId);
        foreach (var grupo in boletosPorVendedor)
        {
            var primerBoleto = grupo.First();
            var vendedor = primerBoleto.Vendedor;
            var zonaNombre = primerBoleto.Zona?.Nombre ?? "Sucursal General";
            var ventasVendedor = grupo.Sum(b => b.TotalApostado);
            var comision = Math.Round(ventasVendedor * 0.10m, 2);
            totalComisiones += comision;

            decimal premiosVendedor = 0;
            if (!string.IsNullOrWhiteSpace(sorteo.NumeroGanador))
            {
                premiosVendedor = grupo.SelectMany(b => b.Jugadas)
                    .Where(j => j.Numero == sorteo.NumeroGanador)
                    .Sum(j => j.PremioCalculado);
            }
            totalPremios += premiosVendedor;

            var nombreCompleto = vendedor != null ? $"{vendedor.Nombres} {vendedor.Apellidos}".Trim() : "Vendedor Desconocido";

            desgloseVendedores.Add(new DesgloseVendedorSorteoDto(
                grupo.Key,
                string.IsNullOrWhiteSpace(nombreCompleto) ? (vendedor?.Username ?? "Vendedor") : nombreCompleto,
                vendedor?.Cedula ?? "--",
                zonaNombre,
                grupo.Count(),
                ventasVendedor,
                comision,
                premiosVendedor
            ));
        }

        var topNumeros = boletos.SelectMany(b => b.Jugadas)
            .GroupBy(j => j.Numero)
            .Select(g => new TopNumeroJugadoDto(
                g.Key,
                g.Sum(j => j.Monto),
                g.Count()
            ))
            .OrderByDescending(x => x.TotalVendido)
            .Take(10)
            .ToList();

        decimal utilidadNeta = totalVentas - totalPremios - totalComisiones;

        var detalle = new SorteoDetalleDto(
            sorteo.Id,
            sorteo.Codigo,
            sorteo.Fecha,
            sorteo.HoraCierre,
            sorteo.HorarioConfiguracion?.Nombre,
            sorteo.Estado,
            sorteo.NumeroGanador,
            totalVentas,
            totalPremios,
            totalComisiones,
            utilidadNeta,
            boletos.Count,
            desgloseVendedores.OrderByDescending(v => v.TotalVendido).ToList(),
            topNumeros
        );

        return Ok(detalle);
    }

    [HttpGet("historial")]
    [Authorize]
    [ProducesResponseType(typeof(List<SorteoHistorialDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHistorial(
        [FromQuery] DateOnly? fechaDesde,
        [FromQuery] DateOnly? fechaHasta,
        [FromQuery] int? zonaId,
        [FromServices] SistemaVentasLO.Application.Common.Interfaces.IApplicationDbContext context)
    {
        var query = context.Sorteos
            .Include(s => s.HorarioConfiguracion)
            .Include(s => s.Zona)
            .AsNoTracking()
            .AsQueryable();

        if (fechaDesde.HasValue)
            query = query.Where(s => s.Fecha >= fechaDesde.Value);

        if (fechaHasta.HasValue)
            query = query.Where(s => s.Fecha <= fechaHasta.Value);

        if (zonaId.HasValue && zonaId.Value > 0)
            query = query.Where(s => s.ZonaId == zonaId.Value || s.ZonaId == null);

        var sorteos = await query
            .OrderByDescending(s => s.Fecha)
            .ThenByDescending(s => s.HoraCierre)
            .Take(100)
            .ToListAsync();

        var sorteoIds = sorteos.Select(s => s.Id).ToList();

        var boletos = await context.Boletos
            .Include(b => b.Vendedor)
            .Include(b => b.Jugadas)
            .Where(b => sorteoIds.Contains(b.SorteoId) && b.Estado == "ACTIVO")
            .AsNoTracking()
            .ToListAsync();

        var boletosPorSorteo = boletos.GroupBy(b => b.SorteoId).ToDictionary(g => g.Key, g => g.ToList());

        var result = new List<SorteoHistorialDto>();

        foreach (var s in sorteos)
        {
            var sorteoBoletos = boletosPorSorteo.TryGetValue(s.Id, out var bList) ? bList : new List<SistemaVentasLO.Domain.Entities.Boleto>();

            decimal ventaTotal = sorteoBoletos.Sum(b => b.TotalApostado);
            decimal premios = 0;
            if (!string.IsNullOrWhiteSpace(s.NumeroGanador))
            {
                premios = sorteoBoletos.SelectMany(b => b.Jugadas)
                    .Where(j => j.Numero == s.NumeroGanador)
                    .Sum(j => j.PremioCalculado);
            }

            decimal comisiones = Math.Round(ventaTotal * 0.10m, 2);
            decimal utilidadNeta = ventaTotal - premios - comisiones;
            int cantidadVendedores = sorteoBoletos.Select(b => b.VendedorId).Distinct().Count();

            result.Add(new SorteoHistorialDto(
                s.Id,
                s.Codigo,
                s.Fecha,
                s.HoraCierre,
                s.HorarioConfiguracion?.Nombre,
                s.Estado,
                s.NumeroGanador,
                ventaTotal,
                premios,
                comisiones,
                utilidadNeta,
                sorteoBoletos.Count,
                cantidadVendedores
            ));
        }

        return Ok(result);
    }
}
