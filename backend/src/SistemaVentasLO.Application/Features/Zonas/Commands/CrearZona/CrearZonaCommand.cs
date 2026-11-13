using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Zonas.DTOs;
using SistemaVentasLO.Domain.Entities;
using SistemaVentasLO.Domain.Exceptions;

namespace SistemaVentasLO.Application.Features.Zonas.Commands.CrearZona;

public record CrearZonaCommand(string Nombre, decimal CoeficientePremio) : IRequest<ZonaDto>;

public class CrearZonaCommandValidator : AbstractValidator<CrearZonaCommand>
{
    public CrearZonaCommandValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre de la zona es obligatorio.")
            .MaximumLength(100).WithMessage("El nombre de la zona no puede superar 100 caracteres.");

        RuleFor(x => x.CoeficientePremio)
            .GreaterThan(0).WithMessage("El coeficiente de premio debe ser un número positivo mayor a 0 (ej. 70.00, 80.00, 90.00).");
    }
}

public class CrearZonaCommandHandler : IRequestHandler<CrearZonaCommand, ZonaDto>
{
    private readonly IApplicationDbContext _context;

    public CrearZonaCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ZonaDto> Handle(CrearZonaCommand request, CancellationToken cancellationToken)
    {
        var existeNombre = await _context.Zonas
            .AnyAsync(z => z.Nombre.ToLower() == request.Nombre.Trim().ToLower(), cancellationToken);

        if (existeNombre)
        {
            throw new DomainException($"Ya existe una zona comercial registrada con el nombre '{request.Nombre.Trim()}'.");
        }

        var zona = new Zona
        {
            Nombre = request.Nombre.Trim(),
            CoeficientePremio = request.CoeficientePremio,
            Estado = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Zonas.Add(zona);
        await _context.SaveChangesAsync(cancellationToken);

        return new ZonaDto(
            zona.Id,
            zona.Nombre,
            zona.CoeficientePremio,
            zona.Estado,
            zona.CreatedAt,
            zona.UpdatedAt,
            0
        );
    }
}
