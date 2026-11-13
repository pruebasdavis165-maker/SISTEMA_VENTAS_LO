using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Domain.Exceptions;

namespace SistemaVentasLO.Application.Features.Vendedores.Commands.ResetPassword;

public record ResetPasswordCommand(Guid VendedorId, string NuevaPassword) : IRequest<bool>;

public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public ResetPasswordCommandHandler(IApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<bool> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var vendedor = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == request.VendedorId, cancellationToken);
        if (vendedor == null)
        {
            throw new DomainException($"No se encontró el vendedor con ID {request.VendedorId}.");
        }

        if (string.IsNullOrWhiteSpace(request.NuevaPassword) || request.NuevaPassword.Length < 6)
        {
            throw new DomainException("La nueva contraseña debe tener al menos 6 caracteres.");
        }

        vendedor.PasswordHash = _passwordHasher.HashPassword(request.NuevaPassword);
        vendedor.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
