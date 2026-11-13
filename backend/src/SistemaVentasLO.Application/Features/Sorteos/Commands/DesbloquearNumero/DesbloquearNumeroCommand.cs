using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Domain.Exceptions;

namespace SistemaVentasLO.Application.Features.Sorteos.Commands.DesbloquearNumero;

public record DesbloquearNumeroCommand(long SorteoId, string Numero, string? Alcance = null) : IRequest<bool>;

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

        var bloqueos = await bloqueosQuery.ToListAsync(cancellationToken);

        if (!bloqueos.Any())
            throw new DomainException($"No se encontraron bloqueos para el número {request.Numero} en este sorteo.");

        _context.BloqueosNumeros.RemoveRange(bloqueos);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
