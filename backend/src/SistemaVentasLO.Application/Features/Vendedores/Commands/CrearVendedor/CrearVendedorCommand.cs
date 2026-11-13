using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Vendedores.DTOs;
using SistemaVentasLO.Domain.Entities;
using SistemaVentasLO.Domain.Exceptions;

namespace SistemaVentasLO.Application.Features.Vendedores.Commands.CrearVendedor;

public record CrearVendedorCommand(
    string Cedula,
    string Nombres,
    string Apellidos,
    string? Celular,
    string? Direccion,
    string Username,
    string Password,
    int ZonaId,
    decimal PrecioBase,
    decimal PrecioVenta,
    decimal SaldoInicial,
    Guid OperadorId
) : IRequest<VendedorDto>;

public class CrearVendedorCommandValidator : AbstractValidator<CrearVendedorCommand>
{
    public CrearVendedorCommandValidator()
    {
        RuleFor(x => x.Cedula)
            .NotEmpty().WithMessage("La cédula del vendedor es obligatoria.")
            .MaximumLength(20).WithMessage("La cédula no puede superar 20 caracteres.");

        RuleFor(x => x.Nombres)
            .NotEmpty().WithMessage("Los nombres son obligatorios.")
            .MaximumLength(100);

        RuleFor(x => x.Apellidos)
            .NotEmpty().WithMessage("Los apellidos son obligatorios.")
            .MaximumLength(100);

        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("El nombre de usuario es obligatorio.")
            .MaximumLength(50);

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("La contraseña inicial es obligatoria.")
            .MinimumLength(6).WithMessage("La contraseña debe tener al menos 6 caracteres.");

        RuleFor(x => x.ZonaId)
            .GreaterThan(0).WithMessage("La vinculación a una zona comercial/sucursal es obligatoria.");

        RuleFor(x => x.PrecioBase)
            .GreaterThanOrEqualTo(0).WithMessage("El precio base no puede ser negativo.");

        RuleFor(x => x.PrecioVenta)
            .GreaterThanOrEqualTo(x => x.PrecioBase)
            .WithMessage("El precio de venta debe ser mayor o igual al precio base.");

        RuleFor(x => x.SaldoInicial)
            .GreaterThanOrEqualTo(0).WithMessage("El saldo inicial no puede ser negativo.");
    }
}

public class CrearVendedorCommandHandler : IRequestHandler<CrearVendedorCommand, VendedorDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public CrearVendedorCommandHandler(IApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<VendedorDto> Handle(CrearVendedorCommand request, CancellationToken cancellationToken)
    {
        var zona = await _context.Zonas.FirstOrDefaultAsync(z => z.Id == request.ZonaId, cancellationToken);
        if (zona == null)
        {
            throw new DomainException($"No se encontró la zona con ID {request.ZonaId}.");
        }

        var existeCedula = await _context.Usuarios.AnyAsync(u => u.Cedula == request.Cedula.Trim(), cancellationToken);
        if (existeCedula)
        {
            throw new DomainException($"Ya existe un usuario registrado con la cédula '{request.Cedula.Trim()}'.");
        }

        var existeUsername = await _context.Usuarios.AnyAsync(u => u.Username.ToLower() == request.Username.Trim().ToLower(), cancellationToken);
        if (existeUsername)
        {
            throw new DomainException($"El nombre de usuario '{request.Username.Trim()}' ya está en uso.");
        }

        // Rol Vendedor (ID 2)
        var rolVendedor = await _context.Roles.FirstOrDefaultAsync(r => r.Nombre == "VENDEDOR", cancellationToken)
            ?? await _context.Roles.FirstOrDefaultAsync(r => r.Id == 2, cancellationToken);

        if (rolVendedor == null)
        {
            throw new DomainException("El rol de vendedor no está configurado en el sistema.");
        }

        var vendedorId = Guid.NewGuid();
        var passwordHash = _passwordHasher.HashPassword(request.Password);

        var vendedor = new Usuario
        {
            Id = vendedorId,
            Cedula = request.Cedula.Trim(),
            Nombres = request.Nombres.Trim(),
            Apellidos = request.Apellidos.Trim(),
            Celular = request.Celular?.Trim(),
            Direccion = request.Direccion?.Trim(),
            Username = request.Username.Trim(),
            PasswordHash = passwordHash,
            RolId = rolVendedor.Id,
            ZonaId = zona.Id,
            PrecioBase = request.PrecioBase,
            PrecioVenta = request.PrecioVenta,
            SaldoCredito = request.SaldoInicial,
            Estado = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Usuarios.Add(vendedor);

        if (request.SaldoInicial > 0)
        {
            _context.TransaccionesSaldo.Add(new TransaccionSaldo
            {
                VendedorId = vendedorId,
                OperadorId = request.OperadorId,
                TipoMovimiento = "RECARGA_CREDITO",
                Monto = request.SaldoInicial,
                SaldoAnterior = 0.00m,
                SaldoPosterior = request.SaldoInicial,
                Concepto = "Asignación inicial de saldo operativo al crear vendedor",
                CreatedAt = DateTime.UtcNow
            });
        }

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
