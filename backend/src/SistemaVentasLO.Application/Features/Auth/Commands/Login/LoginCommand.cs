using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SistemaVentasLO.Application.Common.Interfaces;
using SistemaVentasLO.Application.Features.Auth.DTOs;
using SistemaVentasLO.Domain.Exceptions;

namespace SistemaVentasLO.Application.Features.Auth.Commands.Login;

public record LoginCommand(string Username, string Password) : IRequest<LoginResponse>;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("El nombre de usuario es obligatorio.")
            .MaximumLength(50).WithMessage("El usuario no puede superar 50 caracteres.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("La contraseña es obligatoria.");
    }
}

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public LoginCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<LoginResponse> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _context.Usuarios
            .Include(u => u.Rol)
            .Include(u => u.Zona)
            .FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.ToLower(), cancellationToken);

        if (usuario == null)
        {
            throw new UnauthorizedAccessException("Credenciales de acceso inválidas.");
        }

        if (!usuario.Estado)
        {
            throw new DomainException("El usuario se encuentra inactivo o suspendido. Contacte a la administración.");
        }

        var isPasswordValid = _passwordHasher.VerifyPassword(request.Password, usuario.PasswordHash);
        if (!isPasswordValid)
        {
            throw new UnauthorizedAccessException("Credenciales de acceso inválidas.");
        }

        var token = _jwtTokenGenerator.GenerateToken(usuario);

        var profile = new UserProfileDto(
            usuario.Id,
            usuario.Username,
            usuario.Cedula,
            usuario.Nombres,
            usuario.Apellidos,
            usuario.Rol.Nombre,
            usuario.ZonaId,
            usuario.Zona?.Nombre,
            usuario.Zona?.CoeficientePremio,
            usuario.SaldoCredito,
            usuario.PrecioBase,
            usuario.PrecioVenta
        );

        return new LoginResponse(
            AccessToken: token,
            TokenType: "Bearer",
            ExpiresInMinutes: 480,
            User: profile
        );
    }
}
