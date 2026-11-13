using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaVentasLO.Application.Features.Sorteos.Commands.BloquearNumero;
using SistemaVentasLO.Application.Features.Sorteos.Commands.CambiarEstadoSorteo;
using SistemaVentasLO.Application.Features.Sorteos.Commands.CrearSorteo;
using SistemaVentasLO.Application.Features.Sorteos.Commands.DesbloquearNumero;
using SistemaVentasLO.Application.Features.Sorteos.Commands.GenerarSorteosDia;
using SistemaVentasLO.Application.Features.Sorteos.DTOs;
using SistemaVentasLO.Application.Features.Sorteos.Queries.ObtenerCuadriculaGlobal;
using SistemaVentasLO.Application.Features.Sorteos.Queries.ObtenerHorarios;
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
        var result = await Mediator.Send(new CambiarEstadoSorteoCommand(id, request.Estado));
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
            request.Motivo,
            adminId
        ));
        return Ok(new { BloqueoId = result, Mensaje = $"Número {request.Numero} bloqueado exitosamente." });
    }

    [HttpDelete("{id:long}/desbloquear-numero/{numero}")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DesbloquearNumero(long id, string numero, [FromQuery] string? alcance)
    {
        await Mediator.Send(new DesbloquearNumeroCommand(id, numero, alcance));
        return Ok(new { Mensaje = $"Número {numero} desbloqueado exitosamente." });
    }
}
