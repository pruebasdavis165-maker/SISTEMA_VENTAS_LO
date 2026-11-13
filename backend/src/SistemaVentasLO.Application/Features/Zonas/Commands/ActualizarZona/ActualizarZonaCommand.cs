using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Zonas.DTOs;
using SistemaVentasLO.Domain.Exceptions;

namespace SistemaVentasLO.Application.Features.Zonas.Commands.ActualizarZona;

public record ActualizarZonaCommand(int Id, string Nombre, decimal CoeficientePremio) : IRequest<ZonaDto>;

public class ActualizarZonaCommandValidator : AbstractValidator<ActualizarZonaCommand>
{
    public ActualizarZonaCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage("El identificador de zona es inválido.");

        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre de la zona es obligatorio.")
            .MaximumLength(100).WithMessage("El nombre de la zona no puede superar 100 caracteres.");

        RuleFor(x => x.CoeficientePremio)
            .GreaterThan(0).WithMessage("El coeficiente de premio debe ser un número positivo mayor a 0.");
    }
}

public class ActualizarZonaCommandHandler : IRequestHandler<ActualizarZonaCommand, ZonaDto>
{
    private readonly IApplicationDbContext _context;

    public ActualizarZonaCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ZonaDto> Handle(ActualizarZonaCommand request, CancellationToken cancellationToken)
    {
        var zona = await _context.Zonas
            .Include(z => z.Usuarios)
            .FirstOrDefaultAsync(z => z.Id == request.Id, cancellationToken);

        if (zona == null)
        {
            throw new DomainException($"No se encontró la zona comercial con ID {request.Id}.");
        }

        var existeNombre = await _context.Zonas
            .AnyAsync(z => z.Nombre.ToLower() == request.Nombre.Trim().ToLower() && z.Id != request.Id, cancellationToken);

        if (existeNombre)
        {
            throw new DomainException($"Ya existe otra zona registrada con el nombre '{request.Nombre.Trim()}'.");
        }

        zona.Nombre = request.Nombre.Trim();
        zona.CoeficientePremio = request.CoeficientePremio;
        zona.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return new ZonaDto(
            zona.Id,
            zona.Nombre,
            zona.CoeficientePremio,
            zona.Estado,
            zona.CreatedAt,
            zona.UpdatedAt,
            zona.Usuarios.Count
        );
    }
}
