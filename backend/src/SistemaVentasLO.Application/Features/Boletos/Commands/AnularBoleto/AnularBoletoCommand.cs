using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Domain.Entities;

namespace SistemaVentasLO.Application.Features.Boletos.Commands.AnularBoleto;

public record AnularBoletoCommand(long BoletoId, Guid VendedorId, string Motivo) : IRequest<AnularBoletoResponse>;

public record AnularBoletoResponse(
    long BoletoId,
    string NumeroBoleto,
    decimal MontoRestituido,
    decimal NuevoSaldoCredito,
    DateTime FechaAnulacion,
    string Mensaje
);

public class AnularBoletoCommandHandler : IRequestHandler<AnularBoletoCommand, AnularBoletoResponse>
{
    private readonly IApplicationDbContext _context;

    public AnularBoletoCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AnularBoletoResponse> Handle(AnularBoletoCommand request, CancellationToken cancellationToken)
    {
        var boleto = await _context.Boletos
            .Include(b => b.Sorteo)
            .Include(b => b.Vendedor)
            .FirstOrDefaultAsync(b => b.Id == request.BoletoId, cancellationToken);

        if (boleto == null)
        {
            throw new InvalidOperationException("El boleto especificado no existe.");
        }

        if (boleto.VendedorId != request.VendedorId)
        {
            throw new InvalidOperationException("No tienes autorización para anular un boleto emitido por otro vendedor.");
        }

        if (boleto.Estado != "ACTIVO")
        {
            throw new InvalidOperationException($"El boleto no puede ser anulado porque se encuentra en estado '{boleto.Estado}'.");
        }

        // Regla de Negocio 1: Máximo 5 minutos desde la emisión
        var minutosDesdeEmision = (DateTime.UtcNow - boleto.FechaEmision).TotalMinutes;
        if (minutosDesdeEmision > 5)
        {
            throw new InvalidOperationException($"Tiempo de tolerancia expirado ({minutosDesdeEmision:F1} min). Los boletos solo pueden ser anulados dentro de los primeros 5 minutos de su emisión.");
        }

        // Regla de Negocio 2: El sorteo debe seguir ABIERTO y faltar más de 5 minutos para su cierre
        if (boleto.Sorteo.Estado != "ABIERTO")
        {
            throw new InvalidOperationException($"No se puede anular el boleto porque el sorteo {boleto.Sorteo.Codigo} ya no está abierto (Estado: {boleto.Sorteo.Estado}).");
        }

        var minutosParaCierre = (boleto.Sorteo.HoraCierre - DateTime.UtcNow).TotalMinutes;
        if (minutosParaCierre <= 5)
        {
            throw new InvalidOperationException($"No se puede anular el boleto porque el sorteo ha entrado en ventana de congelamiento de apuestas ({minutosParaCierre:F1} min restantes).");
        }

        // 1. Cambiar estado del boleto
        boleto.Estado = "ANULADO";

        // 2. Restituir saldo al vendedor
        var saldoAnterior = boleto.Vendedor.SaldoCredito;
        boleto.Vendedor.SaldoCredito += boleto.TotalApostado;
        var saldoPosterior = boleto.Vendedor.SaldoCredito;

        // 3. Registrar transacción de auditoría de saldo
        _context.TransaccionesSaldo.Add(new TransaccionSaldo
        {
            VendedorId = boleto.Vendedor.Id,
            TipoMovimiento = "ANULACION_BOLETO",
            Monto = boleto.TotalApostado,
            SaldoAnterior = saldoAnterior,
            SaldoPosterior = saldoPosterior,
            Concepto = $"Anulación de boleto {boleto.NumeroBoleto}. Motivo: {request.Motivo}",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);

        return new AnularBoletoResponse(
            boleto.Id,
            boleto.NumeroBoleto,
            boleto.TotalApostado,
            boleto.Vendedor.SaldoCredito,
            DateTime.UtcNow,
            "Boleto anulado exitosamente y saldo operativo restituido."
        );
    }
}
