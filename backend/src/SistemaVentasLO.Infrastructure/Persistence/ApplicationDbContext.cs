using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Domain.Entities;

namespace SistemaVentasLO.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<Zona> Zonas => Set<Zona>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<HorarioConfiguracion> HorariosConfiguracion => Set<HorarioConfiguracion>();
    public DbSet<Sorteo> Sorteos => Set<Sorteo>();
    public DbSet<BloqueoNumero> BloqueosNumeros => Set<BloqueoNumero>();
    public DbSet<Boleto> Boletos => Set<Boleto>();
    public DbSet<DetalleJugada> DetalleJugadas => Set<DetalleJugada>();
    public DbSet<TransaccionSaldo> TransaccionesSaldo => Set<TransaccionSaldo>();
    public DbSet<Liquidacion> Liquidaciones => Set<Liquidacion>();
    public DbSet<DetalleLiquidacionVendedor> DetalleLiquidacionesVendedor => Set<DetalleLiquidacionVendedor>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Nombres de tablas en minúscula para PostgreSQL
        modelBuilder.Entity<Rol>().ToTable("roles");
        modelBuilder.Entity<Zona>().ToTable("zonas");
        modelBuilder.Entity<Usuario>().ToTable("usuarios");
        modelBuilder.Entity<HorarioConfiguracion>().ToTable("horarios_configuracion");
        modelBuilder.Entity<Sorteo>().ToTable("sorteos");
        modelBuilder.Entity<BloqueoNumero>().ToTable("bloqueos_numeros");
        modelBuilder.Entity<Boleto>().ToTable("boletos");
        modelBuilder.Entity<DetalleJugada>().ToTable("detalle_jugadas");
        modelBuilder.Entity<TransaccionSaldo>().ToTable("transacciones_saldo");
        modelBuilder.Entity<Liquidacion>().ToTable("liquidaciones");
        modelBuilder.Entity<DetalleLiquidacionVendedor>().ToTable("detalle_liquidaciones_vendedor");

        // Configuraciones de precisión y relaciones
        modelBuilder.Entity<Zona>(entity =>
        {
            entity.Property(e => e.CoeficientePremio).HasPrecision(6, 2);
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.Property(e => e.PrecioBase).HasPrecision(10, 2);
            entity.Property(e => e.PrecioVenta).HasPrecision(10, 2);
            entity.Property(e => e.SaldoCredito).HasPrecision(12, 2);

            entity.HasOne(e => e.Rol)
                .WithMany(r => r.Usuarios)
                .HasForeignKey(e => e.RolId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Zona)
                .WithMany(z => z.Usuarios)
                .HasForeignKey(e => e.ZonaId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Boleto>(entity =>
        {
            entity.Property(e => e.TotalApostado).HasPrecision(12, 2);
            entity.Property(e => e.TotalPremioEstimado).HasPrecision(12, 2);

            entity.HasOne(e => e.Vendedor)
                .WithMany(u => u.Boletos)
                .HasForeignKey(e => e.VendedorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Sorteo)
                .WithMany(s => s.Boletos)
                .HasForeignKey(e => e.SorteoId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DetalleJugada>(entity =>
        {
            entity.Property(e => e.Monto).HasPrecision(12, 2);
            entity.Property(e => e.CoeficienteCongelado).HasPrecision(6, 2);
            entity.Property(e => e.PremioCalculado).HasPrecision(12, 2);

            entity.HasOne(e => e.Boleto)
                .WithMany(b => b.Jugadas)
                .HasForeignKey(e => e.BoletoId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TransaccionSaldo>(entity =>
        {
            entity.Property(e => e.Monto).HasPrecision(12, 2);
            entity.Property(e => e.SaldoAnterior).HasPrecision(12, 2);
            entity.Property(e => e.SaldoPosterior).HasPrecision(12, 2);
        });

        modelBuilder.Entity<Liquidacion>(entity =>
        {
            entity.Property(e => e.VentaTotal).HasPrecision(14, 2);
            entity.Property(e => e.PremioTotal).HasPrecision(14, 2);
            entity.Property(e => e.DiferenciaBruta).HasPrecision(14, 2);
            entity.Property(e => e.ComisionVendedoresTotal).HasPrecision(14, 2);
            entity.Property(e => e.GananciaNetaEmpresa).HasPrecision(14, 2);
        });

        modelBuilder.Entity<DetalleLiquidacionVendedor>(entity =>
        {
            entity.Property(e => e.VentaVendedor).HasPrecision(12, 2);
            entity.Property(e => e.ComisionVendedor).HasPrecision(12, 2);
            entity.Property(e => e.PremiosEnPunto).HasPrecision(12, 2);
            entity.Property(e => e.BalanceNeto).HasPrecision(12, 2);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return base.SaveChangesAsync(cancellationToken);
    }
}
