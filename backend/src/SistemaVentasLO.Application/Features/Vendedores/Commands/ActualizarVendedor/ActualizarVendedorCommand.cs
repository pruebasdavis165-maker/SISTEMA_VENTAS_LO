using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Vendedores.DTOs;
using SistemaVentasLO.Domain.Exceptions;

namespace SistemaVentasLO.Application.Features.Vendedores.Commands.ActualizarVendedor;

public record ActualizarVendedorCommand(
    Guid Id,
    string Cedula,
    string Nombres,
    string Apellidos,
    string? Celular,
    string? Direccion,
    int ZonaId,
    decimal PrecioBase,
    decimal PrecioVenta
) : IRequest<VendedorDto>;

public class ActualizarVendedorCommandValidator : AbstractValidator<ActualizarVendedorCommand>
{
    public ActualizarVendedorCommandValidator()
    {
        RuleFor(x => x.Cedula)
            .NotEmpty().WithMessage("La cédula es obligatoria.")
            .MaximumLength(20)
            .Matches(@"^[0-9]{3}-?[0-9]{6}-?[0-9]{4}[A-Z]$").WithMessage("La cédula debe ser válida para Nicaragua y terminar con letra MAYÚSCULA (ej. 001-120595-0002B).");

        RuleFor(x => x.Nombres).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Apellidos).NotEmpty().MaximumLength(100);
        RuleFor(x => x.ZonaId).GreaterThan(0);
        RuleFor(x => x.PrecioBase).GreaterThanOrEqualTo(0);
        RuleFor(x => x.PrecioVenta).GreaterThanOrEqualTo(x => x.PrecioBase)
            .WithMessage("El precio de venta debe ser mayor o igual al precio base.");
    }
}

public class ActualizarVendedorCommandHandler : IRequestHandler<ActualizarVendedorCommand, VendedorDto>
{
    private readonly IApplicationDbContext _context;

    public ActualizarVendedorCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<VendedorDto> Handle(ActualizarVendedorCommand request, CancellationToken cancellationToken)
    {
        var vendedor = await _context.Usuarios
            .Include(u => u.Zona)
            .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);

        if (vendedor == null)
        {
            throw new DomainException($"No se encontró el vendedor con ID {request.Id}.");
        }

        var zona = await _context.Zonas.FirstOrDefaultAsync(z => z.Id == request.ZonaId, cancellationToken);
        if (zona == null)
        {
            throw new DomainException($"No se encontró la zona con ID {request.ZonaId}.");
        }

        var existeCedula = await _context.Usuarios
            .AnyAsync(u => u.Cedula == request.Cedula.Trim() && u.Id != request.Id, cancellationToken);

        if (existeCedula)
        {
            throw new DomainException($"Ya existe otro usuario con la cédula '{request.Cedula.Trim()}'.");
        }

        vendedor.Cedula = request.Cedula.Trim().ToUpperInvariant();
        vendedor.Nombres = request.Nombres.Trim();
        vendedor.Apellidos = request.Apellidos.Trim();
        vendedor.Celular = request.Celular?.Trim();
        vendedor.Direccion = request.Direccion?.Trim();
        vendedor.ZonaId = zona.Id;
        vendedor.Zona = zona;
        vendedor.PrecioBase = request.PrecioBase;
        vendedor.PrecioVenta = request.PrecioVenta;
        vendedor.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return new VendedorDto(
            vendedor.Id,
            vendedor.Cedula,
            vendedor.Nombres,
            vendedor.Apellidos,
            vendedor.Celular,
            vendedor.Direccion,
            vendedor.Username,
            zona.Id,
            zona.Nombre,
            zona.CoeficientePremio,
            vendedor.PrecioBase,
            vendedor.PrecioVenta,
            vendedor.SaldoCredito,
            vendedor.Estado,
            vendedor.CreatedAt,
            vendedor.UpdatedAt
        );
    }
}
