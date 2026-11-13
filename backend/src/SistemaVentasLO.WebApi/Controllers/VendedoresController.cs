using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaVentasLO.Application.Features.Vendedores.Commands.ActualizarVendedor;
using SistemaVentasLO.Application.Features.Vendedores.Commands.CambiarEstadoVendedor;
using SistemaVentasLO.Application.Features.Vendedores.Commands.CrearVendedor;
using SistemaVentasLO.Application.Features.Vendedores.Commands.RecargarSaldo;
using SistemaVentasLO.Application.Features.Vendedores.Commands.ResetPassword;
using SistemaVentasLO.Application.Features.Vendedores.DTOs;
using SistemaVentasLO.Application.Features.Vendedores.Queries.ObtenerVendedorPorId;
using SistemaVentasLO.Application.Features.Vendedores.Queries.ObtenerVendedores;

namespace SistemaVentasLO.WebApi.Controllers;

[Authorize(Roles = "ADMIN")]
public class VendedoresController : ApiControllerBase
{
    private Guid GetCurrentUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(idClaim, out var id) ? id : Guid.Empty;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<VendedorDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? zonaId,
        [FromQuery] bool? soloActivos,
        [FromQuery] string? search)
    {
        var result = await Mediator.Send(new ObtenerVendedoresQuery(zonaId, soloActivos, search));
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(VendedorDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await Mediator.Send(new ObtenerVendedorPorIdQuery(id));
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(VendedorDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Create([FromBody] CrearVendedorRequest request)
    {
        var operadorId = GetCurrentUserId();
        var result = await Mediator.Send(new CrearVendedorCommand(
            request.Cedula,
            request.Nombres,
            request.Apellidos,
            request.Celular,
            request.Direccion,
            request.Username,
            request.Password,
            request.ZonaId,
            request.PrecioBase,
            request.PrecioVenta,
            request.SaldoInicial,
            operadorId
        ));

        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(VendedorDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Update(Guid id, [FromBody] ActualizarVendedorRequest request)
    {
        var result = await Mediator.Send(new ActualizarVendedorCommand(
            id,
            request.Cedula,
            request.Nombres,
            request.Apellidos,
            request.Celular,
            request.Direccion,
            request.ZonaId,
            request.PrecioBase,
            request.PrecioVenta
        ));

        return Ok(result);
    }

    [HttpPatch("{id:guid}/saldo")]
    [ProducesResponseType(typeof(VendedorDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RecargarSaldo(Guid id, [FromBody] RecargarSaldoRequest request)
    {
        var operadorId = GetCurrentUserId();
        var result = await Mediator.Send(new RecargarSaldoCommand(
            id,
            request.Monto,
            request.Concepto,
            operadorId
        ));

        return Ok(result);
    }

    [HttpPatch("{id:guid}/reset-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword(Guid id, [FromBody] ResetPasswordRequest request)
    {
        await Mediator.Send(new ResetPasswordCommand(id, request.NuevaPassword));
        return Ok(new { message = "Contraseña restablecida exitosamente." });
    }

    [HttpPatch("{id:guid}/estado")]
    [ProducesResponseType(typeof(VendedorDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ChangeState(Guid id, [FromBody] CambiarEstadoVendedorRequest request)
    {
        var result = await Mediator.Send(new CambiarEstadoVendedorCommand(id, request.Estado));
        return Ok(result);
    }
}
