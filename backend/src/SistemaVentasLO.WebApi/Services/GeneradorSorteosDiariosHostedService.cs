using MediatR;
using SistemaVentasLO.Application.Features.Sorteos.Commands.GenerarSorteosDia;

namespace SistemaVentasLO.WebApi.Services;

public class GeneradorSorteosDiariosHostedService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<GeneradorSorteosDiariosHostedService> _logger;

    public GeneradorSorteosDiariosHostedService(
        IServiceProvider serviceProvider,
        ILogger<GeneradorSorteosDiariosHostedService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Servicio en segundo plano de generación de sorteos diarios iniciado.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

                var hoy = SistemaVentasLO.Domain.Common.NicaraguaDateTime.Today;
                _logger.LogInformation("Verificando sorteos automáticos para la fecha de Nicaragua: {Fecha}", hoy);

                await mediator.Send(new GenerarSorteosDiaCommand(hoy, null), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al generar sorteos automáticos en el servicio en segundo plano.");
            }

            // Esperar 1 hora antes de la próxima comprobación
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }
}
