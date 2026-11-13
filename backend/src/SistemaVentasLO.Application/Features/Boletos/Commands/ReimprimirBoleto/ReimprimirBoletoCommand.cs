using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Boletos.DTOs;
using SistemaVentasLO.Domain.Exceptions;

namespace SistemaVentasLO.Application.Features.Boletos.Commands.ReimprimirBoleto;

public record ReimprimirBoletoCommand(long BoletoId) : IRequest<ReimprimirBoletoResponse>;

public class ReimprimirBoletoCommandHandler : IRequestHandler<ReimprimirBoletoCommand, ReimprimirBoletoResponse>
{
    private readonly IApplicationDbContext _context;

    public ReimprimirBoletoCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ReimprimirBoletoResponse> Handle(ReimprimirBoletoCommand request, CancellationToken cancellationToken)
    {
        var boleto = await _context.Boletos
            .FirstOrDefaultAsync(b => b.Id == request.BoletoId, cancellationToken);

        if (boleto == null)
            throw new DomainException("Boleto no encontrado.");

        if (boleto.Estado == "ANULADO")
            throw new DomainException("No se permite reimprimir un boleto anulado.");

        // Regla estricta CU06 / CU09: Toda reimpresión incrementa contador y lleva sello de copia
        boleto.CopiasImpresas += 1;
        await _context.SaveChangesAsync(cancellationToken);

        return new ReimprimirBoletoResponse(
            BoletoId: boleto.Id,
            NumeroBoleto: boleto.NumeroBoleto,
            TotalCopias: boleto.CopiasImpresas,
            MarcaAguaCopia: $"COPIA {boleto.CopiasImpresas}",
            FechaReimpresion: DateTime.UtcNow
        );
    }
}
