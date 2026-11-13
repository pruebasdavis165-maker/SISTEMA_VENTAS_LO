using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaVentasLO.Application.Features.Boletos.Commands.ReimprimirBoleto;
using SistemaVentasLO.Application.Features.Boletos.DTOs;
using SistemaVentasLO.Application.Features.Boletos.Queries.AuditoriaBoletos;

namespace SistemaVentasLO.WebApi.Controllers;

public class BoletosController : ApiControllerBase
{
    [HttpGet("auditoria")]
    [Authorize]
    [ProducesResponseType(typeof(List<BoletoAuditoriaDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Auditoria(
        [FromQuery] string? numeroBoleto,
        [FromQuery] long? sorteoId,
        [FromQuery] Guid? vendedorId,
        [FromQuery] int? zonaId,
        [FromQuery] string? estado,
        [FromQuery] DateOnly? fecha)
    {
        var result = await Mediator.Send(new AuditoriaBoletosQuery(
            numeroBoleto,
            sorteoId,
            vendedorId,
            zonaId,
            estado,
            fecha
        ));
        return Ok(result);
    }

    [HttpPost("{id:long}/reimprimir")]
    [Authorize]
    [ProducesResponseType(typeof(ReimprimirBoletoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reimprimir(long id)
    {
        var result = await Mediator.Send(new ReimprimirBoletoCommand(id));
        return Ok(result);
    }
}
