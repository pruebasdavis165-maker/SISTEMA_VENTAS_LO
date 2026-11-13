using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Vendedores.DTOs;
using SistemaVentasLO.Domain.Exceptions;

namespace SistemaVentasLO.Application.Features.Vendedores.Commands.CambiarEstadoVendedor;

public record CambiarEstadoVendedorCommand(Guid VendedorId, bool Estado) : IRequest<VendedorDto>;

public class CambiarEstadoVendedorCommandHandler : IRequestHandler<CambiarEstadoVendedorCommand, VendedorDto>
{
    private readonly IApplicationDbContext _context;

    public CambiarEstadoVendedorCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<VendedorDto> Handle(CambiarEstadoVendedorCommand request, CancellationToken cancellationToken)
    {
        var vendedor = await _context.Usuarios
            .Include(u => u.Zona)
            .FirstOrDefaultAsync(u => u.Id == request.VendedorId, cancellationToken);

        if (vendedor == null)
        {
            throw new DomainException($"No se encontró el vendedor con ID {request.VendedorId}.");
        }

        vendedor.Estado = request.Estado;
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
