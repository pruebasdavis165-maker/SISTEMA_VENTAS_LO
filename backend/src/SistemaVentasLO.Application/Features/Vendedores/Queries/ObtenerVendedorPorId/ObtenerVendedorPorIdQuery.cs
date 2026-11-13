using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Vendedores.DTOs;
using SistemaVentasLO.Domain.Exceptions;

namespace SistemaVentasLO.Application.Features.Vendedores.Queries.ObtenerVendedorPorId;

public record ObtenerVendedorPorIdQuery(Guid Id) : IRequest<VendedorDto>;

public class ObtenerVendedorPorIdQueryHandler : IRequestHandler<ObtenerVendedorPorIdQuery, VendedorDto>
{
    private readonly IApplicationDbContext _context;

    public ObtenerVendedorPorIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<VendedorDto> Handle(ObtenerVendedorPorIdQuery request, CancellationToken cancellationToken)
    {
        var vendedor = await _context.Usuarios
            .Include(u => u.Zona)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);

        if (vendedor == null)
        {
            throw new DomainException($"No se encontró el vendedor con ID {request.Id}.");
        }

        return new VendedorDto(
            vendedor.Id,
            vendedor.Cedula,
            vendedor.Nombres,
            vendedor.Apellidos,
            vendedor.Celular,
            vendedor.Direccion,
            vendedor.Username,
            vendedor.ZonaId ?? 0,
            vendedor.Zona != null ? vendedor.Zona.Nombre : "Sin Zona",
            vendedor.Zona != null ? vendedor.Zona.CoeficientePremio : 0.00m,
            vendedor.PrecioBase,
            vendedor.PrecioVenta,
            vendedor.SaldoCredito,
            vendedor.Estado,
            vendedor.CreatedAt,
            vendedor.UpdatedAt
        );
    }
}
