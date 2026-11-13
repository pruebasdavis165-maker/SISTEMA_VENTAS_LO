using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Domain.Entities;
using SistemaVentasLO.Domain.Exceptions;

namespace SistemaVentasLO.Application.Features.Sorteos.Commands.BloquearNumero;

public record BloquearNumeroCommand(
    long SorteoId,
    string Numero,
    string Alcance = "GLOBAL",
    int? ZonaId = null,
    Guid? VendedorId = null,
    string? Motivo = null,
    Guid? CreadoPor = null
) : IRequest<long>;

public class BloquearNumeroCommandValidator : AbstractValidator<BloquearNumeroCommand>
{
    public BloquearNumeroCommandValidator()
    {
        RuleFor(x => x.SorteoId).GreaterThan(0);
        RuleFor(x => x.Numero)
            .NotEmpty()
            .Matches(@"^[0-9]{2}$")
            .WithMessage("El número a bloquear debe ser exactamente de dos dígitos entre 00 y 99.");

        RuleFor(x => x.Alcance)
            .Must(a => a == "GLOBAL" || a == "POR_ZONA" || a == "POR_VENDEDOR")
            .WithMessage("El alcance debe ser GLOBAL, POR_ZONA o POR_VENDEDOR.");
    }
}

public class BloquearNumeroCommandHandler : IRequestHandler<BloquearNumeroCommand, long>
{
    private readonly IApplicationDbContext _context;

    public BloquearNumeroCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<long> Handle(BloquearNumeroCommand request, CancellationToken cancellationToken)
    {
        var sorteo = await _context.Sorteos
            .FirstOrDefaultAsync(s => s.Id == request.SorteoId, cancellationToken);

        if (sorteo == null)
            throw new DomainException("Sorteo no encontrado.");

        if (sorteo.Estado == "LIQUIDADO" || sorteo.Estado == "CANCELADO")
            throw new DomainException($"No se pueden aplicar bloqueos a un sorteo en estado {sorteo.Estado}.");

        // Verificar si ya existe bloqueo idéntico
        var existe = await _context.BloqueosNumeros
            .AnyAsync(b => b.SorteoId == request.SorteoId &&
                           b.Numero == request.Numero &&
                           b.Alcance == request.Alcance &&
                           b.ZonaId == request.ZonaId &&
                           b.VendedorId == request.VendedorId, cancellationToken);

        if (existe)
            throw new DomainException($"El número {request.Numero} ya se encuentra bloqueado con este alcance.");

        var bloqueo = new BloqueoNumero
        {
            SorteoId = request.SorteoId,
            Numero = request.Numero,
            Alcance = request.Alcance,
            ZonaId = request.ZonaId,
            VendedorId = request.VendedorId,
            Motivo = request.Motivo ?? "Bloqueo por excedente de riesgo financiero",
            CreadoPor = request.CreadoPor ?? Guid.Empty,
            CreatedAt = DateTime.UtcNow
        };

        _context.BloqueosNumeros.Add(bloqueo);
        await _context.SaveChangesAsync(cancellationToken);

        return bloqueo.Id;
    }
}
