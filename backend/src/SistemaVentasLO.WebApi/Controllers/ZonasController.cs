using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaVentasLO.Application.Features.Zonas.Commands.ActualizarZona;
using SistemaVentasLO.Application.Features.Zonas.Commands.CambiarEstadoZona;
using SistemaVentasLO.Application.Features.Zonas.Commands.CrearZona;
using SistemaVentasLO.Application.Features.Zonas.DTOs;
using SistemaVentasLO.Application.Features.Zonas.Queries.ObtenerZonaPorId;
using SistemaVentasLO.Application.Features.Zonas.Queries.ObtenerZonas;

namespace SistemaVentasLO.WebApi.Controllers;

[Authorize(Roles = "ADMIN")]
public class ZonasController : ApiControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<ZonaDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] bool? soloActivas)
    {
        var result = await Mediator.Send(new ObtenerZonasQuery(soloActivas));
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ZonaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await Mediator.Send(new ObtenerZonaPorIdQuery(id));
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ZonaDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Create([FromBody] CrearZonaRequest request)
    {
        var result = await Mediator.Send(new CrearZonaCommand(request.Nombre, request.CoeficientePremio));
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ZonaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Update(int id, [FromBody] ActualizarZonaRequest request)
    {
        var result = await Mediator.Send(new ActualizarZonaCommand(id, request.Nombre, request.CoeficientePremio, request.Estado));
        return Ok(result);
    }

    [HttpPatch("{id:int}/estado")]
    [ProducesResponseType(typeof(ZonaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ChangeState(int id, [FromBody] CambiarEstadoZonaRequest request)
    {
        var result = await Mediator.Send(new CambiarEstadoZonaCommand(id, request.Estado));
        return Ok(result);
    }

    [HttpGet("{id:int}/bloqueos")]
    [ProducesResponseType(typeof(List<BloqueoZonaDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBloqueosZona(int id, [FromServices] SistemaVentasLO.Application.Common.Interfaces.IApplicationDbContext context)
    {
        var bloqueos = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(
            context.BloqueosNumeros
                .Where(b => b.ZonaId == id && b.Alcance == "POR_ZONA")
                .Select(b => new BloqueoZonaDto(b.Numero, b.Motivo, b.CreatedAt))
                .Distinct()
                .OrderBy(b => b.Numero)
        );

        return Ok(bloqueos);
    }

    [HttpPost("{id:int}/bloqueos")]
    public async Task<IActionResult> BloquearNumerosZona(int id, [FromBody] BloquearNumerosZonaRequest request, [FromServices] SistemaVentasLO.Application.Common.Interfaces.IApplicationDbContext context)
    {
        var zona = await context.Zonas.FindAsync(id);
        if (zona == null) return NotFound("Zona no encontrada");

        var fechaHoy = SistemaVentasLO.Domain.Common.NicaraguaDateTime.Today;
        var sorteos = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(
            context.Sorteos.Where(s => s.Fecha >= fechaHoy && s.Estado != "LIQUIDADO" && s.Estado != "CANCELADO")
        );

        if (!sorteos.Any())
        {
            sorteos = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(
                context.Sorteos.Where(s => s.Estado == "ABIERTO" || s.Estado == "PROGRAMADO")
                    .OrderByDescending(s => s.Id)
                    .Take(4)
            );
        }

        foreach (var num in request.Numeros)
        {
            var cleanNum = num.PadLeft(2, '0');
            foreach (var sorteo in sorteos)
            {
                var existe = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.AnyAsync(
                    context.BloqueosNumeros,
                    b => b.SorteoId == sorteo.Id && b.ZonaId == id && b.Numero == cleanNum && b.Alcance == "POR_ZONA"
                );

                if (!existe)
                {
                    context.BloqueosNumeros.Add(new SistemaVentasLO.Domain.Entities.BloqueoNumero
                    {
                        SorteoId = sorteo.Id,
                        Numero = cleanNum,
                        Alcance = "POR_ZONA",
                        ZonaId = id,
                        Motivo = request.Motivo ?? "Tope preventivo de zona"
                    });
                }
            }
        }

        await context.SaveChangesAsync(default);
        return Ok(new { success = true, total = request.Numeros.Count });
    }

    [HttpDelete("{id:int}/bloqueos/{numero}")]
    public async Task<IActionResult> DesbloquearNumeroZona(int id, string numero, [FromServices] SistemaVentasLO.Application.Common.Interfaces.IApplicationDbContext context)
    {
        var cleanNum = numero.PadLeft(2, '0');
        var bloqueos = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(
            context.BloqueosNumeros.Where(b => b.ZonaId == id && b.Numero == cleanNum && b.Alcance == "POR_ZONA")
        );

        if (bloqueos.Any())
        {
            context.BloqueosNumeros.RemoveRange(bloqueos);
            await context.SaveChangesAsync(default);
        }

        return Ok(new { success = true });
    }
}
