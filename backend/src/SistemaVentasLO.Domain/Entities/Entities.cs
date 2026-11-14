using SistemaVentasLO.Domain.Common;

namespace SistemaVentasLO.Domain.Entities;

public class Rol : BaseEntity<int>
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
}

public class Zona : AuditableEntity<int>
{
    public string Nombre { get; set; } = string.Empty;
    public decimal CoeficientePremio { get; set; }
    public bool Estado { get; set; } = true;
    public ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
    public ICollection<Sorteo> Sorteos { get; set; } = new List<Sorteo>();
}

public class Usuario : AuditableEntity<Guid>
{
    public string Cedula { get; set; } = string.Empty;
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string? Celular { get; set; }
    public string? Direccion { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public int RolId { get; set; }
    public Rol Rol { get; set; } = null!;
    public int? ZonaId { get; set; }
    public Zona? Zona { get; set; }
    public decimal PrecioBase { get; set; } = 0.00m;
    public decimal PrecioVenta { get; set; } = 0.00m;
    public decimal SaldoCredito { get; set; } = 0.00m;
    public bool Estado { get; set; } = true;
    public ICollection<Boleto> Boletos { get; set; } = new List<Boleto>();
    public ICollection<TransaccionSaldo> Transacciones { get; set; } = new List<TransaccionSaldo>();
}

public class HorarioConfiguracion : BaseEntity<int>
{
    public string Nombre { get; set; } = string.Empty;
    public TimeSpan HoraCierre { get; set; }
    public string DiasSemana { get; set; } = "L,M,X,J,V,S,D";
    public int MinutosBloqueoPrevio { get; set; } = 5;
    public int MinutosReaperturaPosterior { get; set; } = 10;
    public bool Activo { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Sorteo : AuditableEntity<long>
{
    public string Codigo { get; set; } = string.Empty;
    public DateOnly Fecha { get; set; }
    public DateTime HoraCierre { get; set; }
    public int? ZonaId { get; set; }
    public Zona? Zona { get; set; }
    public int? HorarioConfiguracionId { get; set; }
    public HorarioConfiguracion? HorarioConfiguracion { get; set; }
    public string Estado { get; set; } = "ABIERTO"; // ABIERTO, BLOQUEADO_VENTA, CERRADO_PENDIENTE_GANADOR, LIQUIDADO, CANCELADO
    public string? NumeroGanador { get; set; }
    public ICollection<Boleto> Boletos { get; set; } = new List<Boleto>();
    public ICollection<BloqueoNumero> Bloqueos { get; set; } = new List<BloqueoNumero>();
}

public class BloqueoNumero : BaseEntity<long>
{
    public long SorteoId { get; set; }
    public Sorteo Sorteo { get; set; } = null!;
    public string Numero { get; set; } = string.Empty;
    public string Alcance { get; set; } = "GLOBAL"; // GLOBAL, POR_ZONA, POR_VENDEDOR
    public int? ZonaId { get; set; }
    public Zona? Zona { get; set; }
    public Guid? VendedorId { get; set; }
    public Usuario? Vendedor { get; set; }
    public decimal MontoLimite { get; set; } = 0; // 0 = Bloqueo total, > 0 = Tope de venta máximo permitido
    public string? Motivo { get; set; }
    public Guid CreadoPor { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Boleto : AuditableEntity<long>
{
    public string NumeroBoleto { get; set; } = string.Empty;
    public string CodigoValidacion { get; set; } = string.Empty;
    public Guid VendedorId { get; set; }
    public Usuario Vendedor { get; set; } = null!;
    public long SorteoId { get; set; }
    public Sorteo Sorteo { get; set; } = null!;
    public int ZonaId { get; set; }
    public Zona Zona { get; set; } = null!;
    public decimal TotalApostado { get; set; }
    public decimal TotalPremioEstimado { get; set; }
    public string Estado { get; set; } = "ACTIVO"; // ACTIVO, ANULADO, PAGADO, NO_PREMIADO
    public int CopiasImpresas { get; set; } = 0;
    public DateTime FechaEmision { get; set; } = DateTime.UtcNow;
    public DateTime? FechaCaducidadCobro { get; set; }
    public ICollection<DetalleJugada> Jugadas { get; set; } = new List<DetalleJugada>();
}

public class DetalleJugada : BaseEntity<long>
{
    public long BoletoId { get; set; }
    public Boleto Boleto { get; set; } = null!;
    public long SorteoId { get; set; }
    public Sorteo Sorteo { get; set; } = null!;
    public string Numero { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public decimal CoeficienteCongelado { get; set; }
    public decimal PremioCalculado { get; set; }
    public bool EsGanador { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class TransaccionSaldo : BaseEntity<long>
{
    public Guid VendedorId { get; set; }
    public Usuario Vendedor { get; set; } = null!;
    public Guid? OperadorId { get; set; }
    public Usuario? Operador { get; set; }
    public string TipoMovimiento { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public decimal SaldoAnterior { get; set; }
    public decimal SaldoPosterior { get; set; }
    public string? Concepto { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Liquidacion : BaseEntity<long>
{
    public long SorteoId { get; set; }
    public Sorteo Sorteo { get; set; } = null!;
    public string NumeroGanador { get; set; } = string.Empty;
    public decimal VentaTotal { get; set; }
    public decimal PremioTotal { get; set; }
    public decimal DiferenciaBruta { get; set; }
    public decimal ComisionVendedoresTotal { get; set; }
    public decimal GananciaNetaEmpresa { get; set; }
    public Guid LiquidadoPor { get; set; }
    public DateTime FechaLiquidacion { get; set; } = DateTime.UtcNow;
    public ICollection<DetalleLiquidacionVendedor> DetalleVendedores { get; set; } = new List<DetalleLiquidacionVendedor>();
}

public class DetalleLiquidacionVendedor : BaseEntity<long>
{
    public long LiquidacionId { get; set; }
    public Liquidacion Liquidacion { get; set; } = null!;
    public Guid VendedorId { get; set; }
    public Usuario Vendedor { get; set; } = null!;
    public decimal VentaVendedor { get; set; }
    public decimal ComisionVendedor { get; set; }
    public decimal PremiosEnPunto { get; set; }
    public decimal BalanceNeto { get; set; }
}
