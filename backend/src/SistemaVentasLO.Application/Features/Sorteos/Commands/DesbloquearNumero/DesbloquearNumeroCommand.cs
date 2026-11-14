using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Domain.Exceptions;

namespace SistemaVentasLO.Application.Features.Sorteos.Commands.DesbloquearNumero;

public record DesbloquearNumeroCommand(
    long SorteoId, 
    string Numero, 
    string? Alcance = null,
    Guid? VendedorId = null,
    int? ZonaId = null
) : IRequest<bool>;

public class DesbloquearNumeroCommandValidator : AbstractValidator<DesbloquearNumeroCommand>
{
    public DesbloquearNumeroCommandValidator()
    {
        RuleFor(x => x.SorteoId).GreaterThan(0);
        RuleFor(x => x.Numero)
            .NotEmpty()
            .Matches(@"^[0-9]{2}$")
            .WithMessage("El número debe ser de 2 dígitos entre 00 y 99.");
    }
}

public class DesbloquearNumeroCommandHandler : IRequestHandler<DesbloquearNumeroCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public DesbloquearNumeroCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DesbloquearNumeroCommand request, CancellationToken cancellationToken)
    {
        var bloqueosQuery = _context.BloqueosNumeros
            .Where(b => b.SorteoId == request.SorteoId && b.Numero == request.Numero);

        if (!string.IsNullOrEmpty(request.Alcance))
        {
            bloqueosQuery = bloqueosQuery.Where(b => b.Alcance == request.Alcance);
        }

        if (request.VendedorId.HasValue)
        {
            bloqueosQuery = bloqueosQuery.Where(b => b.VendedorId == request.VendedorId.Value);
        }

        if (request.ZonaId.HasValue)
        {
            bloqueosQuery = bloqueosQuery.Where(b => b.ZonaId == request.ZonaId.Value);
        }

        var bloqueos = await bloqueosQuery.ToListAsync(cancellationToken);

        if (!bloqueos.Any())
        {
            // Si se intentó un desbloqueo específico pero no existe exactamente, pero existe para el número, permitir desbloquear
            var anyBloqueo = await _context.BloqueosNumeros
                .Where(b => b.SorteoId == request.SorteoId && b.Numero == request.Numero)
                .ToListAsync(cancellationToken);
            if (anyBloqueo.Any())
            {
                _context.BloqueosNumeros.RemoveRange(anyBloqueo);
                await _context.SaveChangesAsync(cancellationToken);
                return true;
            }
            return true;
        }

        _context.BloqueosNumeros.RemoveRange(bloqueos);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
