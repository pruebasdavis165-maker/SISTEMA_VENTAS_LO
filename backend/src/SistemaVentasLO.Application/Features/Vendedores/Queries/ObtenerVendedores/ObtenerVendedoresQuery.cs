using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Vendedores.DTOs;
using SistemaVentasLO.Domain.Exceptions;

namespace SistemaVentasLO.Application.Features.Vendedores.Queries.ObtenerVendedores;

public record ObtenerVendedoresQuery(int? ZonaId = null, bool? SoloActivos = null, string? Search = null) : IRequest<List<VendedorDto>>;

public class ObtenerVendedoresQueryHandler : IRequestHandler<ObtenerVendedoresQuery, List<VendedorDto>>
{
    private readonly IApplicationDbContext _context;

    public ObtenerVendedoresQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<VendedorDto>> Handle(ObtenerVendedoresQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Usuarios
            .Include(u => u.Rol)
            .Include(u => u.Zona)
            .Where(u => u.Rol.Nombre == "VENDEDOR")
            .AsNoTracking();

        if (request.ZonaId.HasValue && request.ZonaId.Value > 0)
        {
            query = query.Where(u => u.ZonaId == request.ZonaId.Value);
        }

        if (request.SoloActivos.HasValue && request.SoloActivos.Value)
        {
            query = query.Where(u => u.Estado);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim().ToLower();
            query = query.Where(u =>
                u.Nombres.ToLower().Contains(term) ||
                u.Apellidos.ToLower().Contains(term) ||
                u.Cedula.ToLower().Contains(term) ||
                u.Username.ToLower().Contains(term));
        }

        return await query
            .OrderBy(u => u.Nombres)
            .Select(u => new VendedorDto(
                u.Id,
                u.Cedula,
                u.Nombres,
                u.Apellidos,
                u.Celular,
                u.Direccion,
                u.Username,
                u.ZonaId ?? 0,
                u.Zona != null ? u.Zona.Nombre : "Sin Zona",
                u.Zona != null ? u.Zona.CoeficientePremio : 0.00m,
                u.PrecioBase,
                u.PrecioVenta,
                u.SaldoCredito,
                u.Estado,
                u.CreatedAt,
                u.UpdatedAt
            ))
            .ToListAsync(cancellationToken);
    }
}
