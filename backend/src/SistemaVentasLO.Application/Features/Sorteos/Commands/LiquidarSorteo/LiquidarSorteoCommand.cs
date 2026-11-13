using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Sorteos.DTOs;
using SistemaVentasLO.Domain.Entities;
using SistemaVentasLO.Domain.Exceptions;

namespace SistemaVentasLO.Application.Features.Sorteos.Commands.LiquidarSorteo;

public record LiquidarSorteoCommand(
    long SorteoId,
    string NumeroGanador,
    Guid LiquidadoPor
) : IRequest<LiquidacionSorteoDto>;

public class LiquidarSorteoCommandValidator : AbstractValidator<LiquidarSorteoCommand>
{
    public LiquidarSorteoCommandValidator()
    {
        RuleFor(x => x.SorteoId).GreaterThan(0);
        RuleFor(x => x.NumeroGanador)
            .NotEmpty()
            .Matches(@"^[0-9]{2}$")
            .WithMessage("El número ganador oficial debe ser exactamente de dos dígitos entre 00 y 99.");
    }
}

public class LiquidarSorteoCommandHandler : IRequestHandler<LiquidarSorteoCommand, LiquidacionSorteoDto>
{
    private readonly IApplicationDbContext _context;

    public LiquidarSorteoCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<LiquidacionSorteoDto> Handle(LiquidarSorteoCommand request, CancellationToken cancellationToken)
    {
        var sorteo = await _context.Sorteos
            .Include(s => s.Boletos)
                .ThenInclude(b => b.Jugadas)
            .Include(s => s.Boletos)
                .ThenInclude(b => b.Vendedor)
                    .ThenInclude(v => v.Zona)
            .FirstOrDefaultAsync(s => s.Id == request.SorteoId, cancellationToken);

        if (sorteo == null)
            throw new DomainException("Sorteo no encontrado.");

        if (sorteo.Estado == "LIQUIDADO")
            throw new DomainException("El sorteo ya ha sido liquidado anteriormente.");

        // Marcamos el sorteo con el número ganador oficial
        sorteo.NumeroGanador = request.NumeroGanador;
        sorteo.Estado = "LIQUIDADO";

        decimal ventaTotal = 0;
        decimal premioTotal = 0;

        // Diccionario por vendedor para el desglose financiero
        var vendedoresMap = new Dictionary<Guid, (Usuario Vendedor, decimal Venta, decimal Comision, decimal Premios)>();

        // 1. Procesar jugadas y boletos
        foreach (var boleto in sorteo.Boletos.Where(b => b.Estado == "ACTIVO"))
        {
            ventaTotal += boleto.TotalApostado;
            bool boletoTienePremio = false;

            var vId = boleto.VendedorId;
            if (!vendedoresMap.ContainsKey(vId))
            {
                vendedoresMap[vId] = (boleto.Vendedor, 0, 0, 0);
            }

            var current = vendedoresMap[vId];
            current.Venta += boleto.TotalApostado;

            // Comisión del vendedor: margen pactado entre PrecioVenta y PrecioBase (CU01 / CU05)
            // Si el precio de venta es por ejemplo 1.00 y precio base 0.85, la comisión es 15%
            decimal pctComision = 0.10m;
            if (boleto.Vendedor.PrecioVenta > 0 && boleto.Vendedor.PrecioVenta > boleto.Vendedor.PrecioBase)
            {
                pctComision = (boleto.Vendedor.PrecioVenta - boleto.Vendedor.PrecioBase) / boleto.Vendedor.PrecioVenta;
            }
            current.Comision += boleto.TotalApostado * pctComision;

            foreach (var jugada in boleto.Jugadas)
            {
                if (jugada.Numero == request.NumeroGanador)
                {
                    jugada.EsGanador = true;
                    // Fórmula reglamentaria: Monto * CoeficienteCongelado
                    jugada.PremioCalculado = jugada.Monto * jugada.CoeficienteCongelado;
                    premioTotal += jugada.PremioCalculado;
                    current.Premios += jugada.PremioCalculado;
                    boletoTienePremio = true;
                }
                else
                {
                    jugada.EsGanador = false;
                }
            }

            if (boletoTienePremio)
            {
                boleto.Estado = "PREMIADO";
                // 30 días para reclamar premio (CU05)
                boleto.FechaCaducidadCobro = DateTime.UtcNow.AddDays(30);
            }
            else
            {
                boleto.Estado = "NO_PREMIADO";
            }

            vendedoresMap[vId] = current;
        }

        decimal diferenciaBruta = ventaTotal - premioTotal;
        decimal comisionVendedoresTotal = vendedoresMap.Values.Sum(v => v.Comision);
        decimal gananciaNetaEmpresa = diferenciaBruta - comisionVendedoresTotal;

        // 2. Crear Liquidación Principal
        var liquidacion = new Liquidacion
        {
            SorteoId = sorteo.Id,
            NumeroGanador = request.NumeroGanador,
            VentaTotal = ventaTotal,
            PremioTotal = premioTotal,
            DiferenciaBruta = diferenciaBruta,
            ComisionVendedoresTotal = comisionVendedoresTotal,
            GananciaNetaEmpresa = gananciaNetaEmpresa,
            LiquidadoPor = request.LiquidadoPor,
            FechaLiquidacion = DateTime.UtcNow
        };

        _context.Liquidaciones.Add(liquidacion);

        // 3. Crear Detalle de Liquidación por Vendedor y Ajustar Saldo Operativo
        var desgloseList = new List<DetalleLiquidacionVendedorDto>();

        foreach (var entry in vendedoresMap.Values)
        {
            // Balance Neto del vendedor en el sorteo:
            // Lo que debe entregar a la empresa: Venta - Comisión - PremiosPagadosEnPunto
            decimal balanceNeto = entry.Venta - entry.Comision - entry.Premios;

            var detalleVendedor = new DetalleLiquidacionVendedor
            {
                Liquidacion = liquidacion,
                VendedorId = entry.Vendedor.Id,
                VentaVendedor = entry.Venta,
                ComisionVendedor = entry.Comision,
                PremiosEnPunto = entry.Premios,
                BalanceNeto = balanceNeto
            };

            _context.DetalleLiquidacionesVendedor.Add(detalleVendedor);

            // Impacto en el saldo de vendedor (TransaccionSaldo)
            decimal saldoAnterior = entry.Vendedor.SaldoCredito;
            // Si el vendedor tiene balanceNeto positivo, debe liquidarlo a la empresa o se deduce de su saldo/cupo
            entry.Vendedor.SaldoCredito -= balanceNeto;
            decimal saldoPosterior = entry.Vendedor.SaldoCredito;

            var transaccion = new TransaccionSaldo
            {
                VendedorId = entry.Vendedor.Id,
                OperadorId = request.LiquidadoPor,
                TipoMovimiento = "LIQUIDACION_SORTEO",
                Monto = balanceNeto,
                SaldoAnterior = saldoAnterior,
                SaldoPosterior = saldoPosterior,
                Concepto = $"Liquidación Sorteo #{sorteo.Codigo} - Ganador: {request.NumeroGanador}",
                CreatedAt = DateTime.UtcNow
            };

            _context.TransaccionesSaldo.Add(transaccion);

            desgloseList.Add(new DetalleLiquidacionVendedorDto(
                VendedorId: entry.Vendedor.Id,
                CodigoVendedor: entry.Vendedor.Username,
                NombreVendedor: $"{entry.Vendedor.Nombres} {entry.Vendedor.Apellidos}",
                ZonaNombre: entry.Vendedor.Zona?.Nombre ?? "Sin Zona",
                VentaVendedor: entry.Venta,
                ComisionVendedor: entry.Comision,
                PremiosEnPunto: entry.Premios,
                BalanceNeto: balanceNeto
            ));
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new LiquidacionSorteoDto(
            Id: liquidacion.Id,
            SorteoId: sorteo.Id,
            CodigoSorteo: sorteo.Codigo,
            NumeroGanador: request.NumeroGanador,
            VentaTotal: ventaTotal,
            PremioTotal: premioTotal,
            DiferenciaBruta: diferenciaBruta,
            ComisionVendedoresTotal: comisionVendedoresTotal,
            GananciaNetaEmpresa: gananciaNetaEmpresa,
            FechaLiquidacion: liquidacion.FechaLiquidacion,
            DesgloseVendedores: desgloseList
        );
    }
}
