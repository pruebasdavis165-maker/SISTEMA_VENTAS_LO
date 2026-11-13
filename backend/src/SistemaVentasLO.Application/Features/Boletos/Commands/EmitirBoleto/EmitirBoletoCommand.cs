using System.Security.Cryptography;
using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Boletos.DTOs;
using SistemaVentasLO.Domain.Entities;

namespace SistemaVentasLO.Application.Features.Boletos.Commands.EmitirBoleto;

public record ItemJugadaRequest(string Numero, decimal Monto);

public record EmitirBoletoCommand(
    Guid VendedorId,
    long SorteoId,
    List<ItemJugadaRequest> Jugadas
) : IRequest<BoletoEmitidoResponse>;

public record BoletoEmitidoResponse(
    long BoletoId,
    string NumeroBoleto,
    string CodigoValidacion,
    string CodigoSorteo,
    decimal TotalApostado,
    decimal TotalPremioEstimado,
    decimal NuevoSaldoCredito,
    DateTime FechaEmision,
    List<JugadaBoletoDto> Jugadas
);

public class EmitirBoletoCommandHandler : IRequestHandler<EmitirBoletoCommand, BoletoEmitidoResponse>
{
    private readonly IApplicationDbContext _context;

    public EmitirBoletoCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<BoletoEmitidoResponse> Handle(EmitirBoletoCommand request, CancellationToken cancellationToken)
    {
        if (request.Jugadas == null || request.Jugadas.Count == 0)
        {
            throw new InvalidOperationException("El boleto debe contener al menos una jugada.");
        }

        // 1. Obtener Sorteo y validar que esté ABIERTO y falten más de 5 minutos
        var sorteo = await _context.Sorteos
            .Include(s => s.Zona)
            .FirstOrDefaultAsync(s => s.Id == request.SorteoId, cancellationToken);

        if (sorteo == null)
        {
            throw new InvalidOperationException("El sorteo especificado no existe.");
        }

        if (sorteo.Estado != "ABIERTO")
        {
            throw new InvalidOperationException($"El sorteo {sorteo.Codigo} no está abierto para venta (Estado: {sorteo.Estado}).");
        }

        var minutosRestantes = (sorteo.HoraCierre - DateTime.UtcNow).TotalMinutes;
        if (minutosRestantes <= 5)
        {
            throw new InvalidOperationException($"Venta cerrada. Faltan menos de 5 minutos para el sorteo {sorteo.Codigo} ({minutosRestantes:F1} min restantes).");
        }

        // 2. Obtener Vendedor y Zona
        var vendedor = await _context.Usuarios
            .Include(u => u.Zona)
            .FirstOrDefaultAsync(u => u.Id == request.VendedorId, cancellationToken);

        if (vendedor == null)
        {
            throw new InvalidOperationException("El vendedor no existe.");
        }

        if (!vendedor.Estado)
        {
            throw new InvalidOperationException("El vendedor se encuentra inactivo.");
        }

        var coeficiente = vendedor.Zona?.CoeficientePremio ?? 70m;
        var zonaId = vendedor.ZonaId ?? (sorteo.ZonaId ?? 1);

        // 3. Validar Saldo del Vendedor
        var totalApostado = request.Jugadas.Sum(j => j.Monto);
        if (totalApostado <= 0)
        {
            throw new InvalidOperationException("El total apostado debe ser mayor a cero.");
        }

        if (vendedor.SaldoCredito < totalApostado)
        {
            throw new InvalidOperationException($"Saldo insuficiente. Saldo disponible: ${vendedor.SaldoCredito:F2}, Total requerido: ${totalApostado:F2}.");
        }

        // 4. Validar Bloqueos de Riesgo (Global, Zona, Vendedor)
        var numerosJugados = request.Jugadas.Select(j => j.Numero).Distinct().ToList();
        var bloqueos = await _context.BloqueosNumeros
            .Where(b => b.SorteoId == request.SorteoId && numerosJugados.Contains(b.Numero))
            .Where(b => b.Alcance == "GLOBAL" ||
                        (b.Alcance == "POR_ZONA" && b.ZonaId == zonaId) ||
                        (b.Alcance == "POR_VENDEDOR" && b.VendedorId == request.VendedorId))
            .ToListAsync(cancellationToken);

        if (bloqueos.Any())
        {
            var b = bloqueos.First();
            throw new InvalidOperationException($"El número {b.Numero} está bloqueado por riesgo financiero ({b.Alcance}): {b.Motivo ?? "Sin motivo especificado"}.");
        }

        // 5. Descontar Saldo y Registrar Movimiento
        var saldoAnterior = vendedor.SaldoCredito;
        vendedor.SaldoCredito -= totalApostado;
        var saldoPosterior = vendedor.SaldoCredito;

        _context.TransaccionesSaldo.Add(new TransaccionSaldo
        {
            VendedorId = vendedor.Id,
            TipoMovimiento = "VENTA_BOLETO",
            Monto = -totalApostado,
            SaldoAnterior = saldoAnterior,
            SaldoPosterior = saldoPosterior,
            Concepto = $"Emisión de boleto para sorteo {sorteo.Codigo}",
            CreatedAt = DateTime.UtcNow
        });

        // 6. Generar Identificador y Código Hash de Validación
        var timestamp = DateTime.UtcNow.ToString("yyMMddHHmmss");
        var randomSuffix = RandomNumberGenerator.GetInt32(1000, 9999);
        var numeroBoleto = $"TK-{timestamp}-{randomSuffix}";

        var rawHashData = $"{numeroBoleto}-{vendedor.Id}-{sorteo.Id}-{totalApostado}-{DateTime.UtcNow.Ticks}";
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawHashData));
        var codigoValidacion = Convert.ToHexString(hashBytes)[..12]; // 12 caracteres alfanuméricos seguros

        decimal totalPremioEstimado = 0;
        var detallesJugadas = new List<DetalleJugada>();

        foreach (var j in request.Jugadas)
        {
            var premioCalc = Math.Round(j.Monto * coeficiente, 2);
            if (premioCalc > totalPremioEstimado)
            {
                totalPremioEstimado = premioCalc;
            }

            detallesJugadas.Add(new DetalleJugada
            {
                SorteoId = sorteo.Id,
                Numero = j.Numero.PadLeft(2, '0'),
                Monto = j.Monto,
                CoeficienteCongelado = coeficiente,
                PremioCalculado = premioCalc,
                EsGanador = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        var boleto = new Boleto
        {
            NumeroBoleto = numeroBoleto,
            CodigoValidacion = codigoValidacion,
            VendedorId = vendedor.Id,
            SorteoId = sorteo.Id,
            ZonaId = zonaId,
            TotalApostado = totalApostado,
            TotalPremioEstimado = totalPremioEstimado,
            Estado = "ACTIVO",
            CopiasImpresas = 0,
            FechaEmision = DateTime.UtcNow,
            FechaCaducidadCobro = DateTime.UtcNow.AddDays(7),
            Jugadas = detallesJugadas
        };

        _context.Boletos.Add(boleto);
        await _context.SaveChangesAsync(cancellationToken);

        var jugadasDtos = boleto.Jugadas.Select(dj => new JugadaBoletoDto(
            dj.Id,
            dj.Numero,
            dj.Monto,
            dj.CoeficienteCongelado,
            dj.PremioCalculado,
            dj.EsGanador
        )).ToList();

        return new BoletoEmitidoResponse(
            boleto.Id,
            boleto.NumeroBoleto,
            boleto.CodigoValidacion,
            sorteo.Codigo,
            boleto.TotalApostado,
            boleto.TotalPremioEstimado,
            vendedor.SaldoCredito,
            boleto.FechaEmision,
            jugadasDtos
        );
    }
}
