using Microsoft.AspNetCore.Mvc;

namespace SistemaVentasLO.WebApi.Controllers;

public class HealthController : ApiControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "Healthy",
            system = "SISTEMA_VENTAS_LO",
            architecture = "Clean Architecture .NET 8",
            timestamp = DateTime.UtcNow
        });
    }
}
