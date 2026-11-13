using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaVentasLO.Application.Features.Sorteos.Commands.CambiarEstadoSorteo;
using SistemaVentasLO.Application.Features.Sorteos.Commands.CrearSorteo;
using SistemaVentasLO.Application.Features.Sorteos.Commands.GenerarSorteosDia;
using SistemaVentasLO.Application.Features.Sorteos.DTOs;
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
}
