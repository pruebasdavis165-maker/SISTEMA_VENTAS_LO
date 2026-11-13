using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Vendedores.DTOs;
using SistemaVentasLO.Domain.Entities;
using SistemaVentasLO.Domain.Exceptions;

namespace SistemaVentasLO.Application.Features.Vendedores.Commands.RecargarSaldo;

public record RecargarSaldoCommand(
    Guid VendedorId,
    decimal Monto,
    string? Concepto,
    Guid OperadorId
) : IRequest<VendedorDto>;

public class RecargarSaldoCommandValidator : AbstractValidator<RecargarSaldoCommand>
{
    public RecargarSaldoCommandValidator()
    {
        RuleFor(x => x.VendedorId).NotEmpty();
        RuleFor(x => x.Monto)
            .NotEqual(0).WithMessage("El monto de recarga o ajuste no puede ser cero.");
    }
}

public class RecargarSaldoCommandHandler : IRequestHandler<RecargarSaldoCommand, VendedorDto>
{
    private readonly IApplicationDbContext _context;

    public RecargarSaldoCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<VendedorDto> Handle(RecargarSaldoCommand request, CancellationToken cancellationToken)
    {
        var vendedor = await _context.Usuarios
            .Include(u => u.Zona)
            .FirstOrDefaultAsync(u => u.Id == request.VendedorId, cancellationToken);

        if (vendedor == null)
        {
            throw new DomainException($"No se encontró el vendedor con ID {request.VendedorId}.");
        }

        var saldoAnterior = vendedor.SaldoCredito;
        var saldoPosterior = saldoAnterior + request.Monto;

        if (saldoPosterior < 0)
        {
            throw new DomainException($"El ajuste dejaría el saldo en negativo ({saldoPosterior:C}). Operación denegada.");
        }

        vendedor.SaldoCredito = saldoPosterior;
        vendedor.UpdatedAt = DateTime.UtcNow;

        var tipoMovimiento = request.Monto > 0 ? "RECARGA_CREDITO" : "AJUSTE_ADMIN";

        _context.TransaccionesSaldo.Add(new TransaccionSaldo
        {
            VendedorId = vendedor.Id,
            OperadorId = request.OperadorId,
            TipoMovimiento = tipoMovimiento,
            Monto = request.Monto,
            SaldoAnterior = saldoAnterior,
            SaldoPosterior = saldoPosterior,
            Concepto = request.Concepto ?? (request.Monto > 0 ? "Recarga de saldo operativo por Administrador" : "Ajuste de saldo por Administrador"),
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);

        return new VendedorDto(
            vendedor.Id,
            vendedor.Cedula,
            vendedor.Nombres,
            vendedor.Apellidos,
            vendedor.Celular,
            vendedor.Direccion,
            vendedor.Username,
            vendedor.ZonaId ?? 0,
            vendedor.Zona?.Nombre ?? "Sin Zona",
            vendedor.Zona?.CoeficientePremio ?? 0.00m,
            vendedor.PrecioBase,
            vendedor.PrecioVenta,
            vendedor.SaldoCredito,
            vendedor.Estado,
            vendedor.CreatedAt,
            vendedor.UpdatedAt
        );
    }
}
