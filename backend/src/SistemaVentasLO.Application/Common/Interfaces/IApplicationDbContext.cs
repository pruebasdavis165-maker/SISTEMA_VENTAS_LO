using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Domain.Entities;

namespace SistemaVentasLO.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Rol> Roles { get; }
    DbSet<Zona> Zonas { get; }
    DbSet<Usuario> Usuarios { get; }
    DbSet<HorarioConfiguracion> HorariosConfiguracion { get; }
    DbSet<Sorteo> Sorteos { get; }
    DbSet<BloqueoNumero> BloqueosNumeros { get; }
    DbSet<Boleto> Boletos { get; }
    DbSet<DetalleJugada> DetalleJugadas { get; }
    DbSet<TransaccionSaldo> TransaccionesSaldo { get; }
    DbSet<Liquidacion> Liquidaciones { get; }
    DbSet<DetalleLiquidacionVendedor> DetalleLiquidacionesVendedor { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
