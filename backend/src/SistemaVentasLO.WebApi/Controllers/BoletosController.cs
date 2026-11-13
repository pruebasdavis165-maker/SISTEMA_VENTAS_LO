using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaVentasLO.Application.Features.Boletos.Commands.AnularBoleto;
using SistemaVentasLO.Application.Features.Boletos.Commands.EmitirBoleto;
using SistemaVentasLO.Application.Features.Boletos.Commands.ReimprimirBoleto;
using SistemaVentasLO.Application.Features.Boletos.DTOs;
using SistemaVentasLO.Application.Features.Boletos.Queries.AuditoriaBoletos;
using SistemaVentasLO.Application.Features.Boletos.Queries.ObtenerHistorialTurno;

namespace SistemaVentasLO.WebApi.Controllers;

public class BoletosController : ApiControllerBase
{
    [HttpPost("emitir")]
    [Authorize]
    [ProducesResponseType(typeof(BoletoEmitidoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Emitir([FromBody] EmitirBoletoRequestDto request)
    {
        var idClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                      ?? User.FindFirst("sub")?.Value;

        if (!Guid.TryParse(idClaim, out var vendedorId))
        {
            return Unauthorized(new { message = "Identidad de vendedor no válida." });
        }

        var result = await Mediator.Send(new EmitirBoletoCommand(
            vendedorId,
            request.SorteoId,
            request.Jugadas.Select(j => new ItemJugadaRequest(j.Numero, j.Monto)).ToList()
        ));

        return Ok(result);
    }

    [HttpGet("historial-turno")]
    [Authorize]
    [ProducesResponseType(typeof(ResumenTurnoResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHistorialTurno()
    {
        var idClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                      ?? User.FindFirst("sub")?.Value;

        if (!Guid.TryParse(idClaim, out var vendedorId))
        {
            return Unauthorized(new { message = "Identidad de vendedor no válida." });
        }

        var result = await Mediator.Send(new ObtenerHistorialTurnoQuery(vendedorId));
        return Ok(result);
    }

    [HttpPost("{id:long}/anular")]
    [Authorize]
    [ProducesResponseType(typeof(AnularBoletoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Anular(long id, [FromBody] AnularBoletoRequestDto request)
    {
        var idClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                      ?? User.FindFirst("sub")?.Value;

        if (!Guid.TryParse(idClaim, out var vendedorId))
        {
            return Unauthorized(new { message = "Identidad de vendedor no válida." });
        }

        var result = await Mediator.Send(new AnularBoletoCommand(id, vendedorId, request.Motivo ?? "Anulación solicitada por cliente"));
        return Ok(result);
    }

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
