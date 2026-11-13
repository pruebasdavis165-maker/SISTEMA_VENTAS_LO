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
        var result = await Mediator.Send(new ActualizarZonaCommand(id, request.Nombre, request.CoeficientePremio));
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
}
