# Stage 1: Build de la Solución .NET 8 Clean Architecture
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar archivos de proyecto y restaurar dependencias
COPY ["src/SistemaVentasLO.WebApi/SistemaVentasLO.WebApi.csproj", "src/SistemaVentasLO.WebApi/"]
COPY ["src/SistemaVentasLO.Application/SistemaVentasLO.Application.csproj", "src/SistemaVentasLO.Application/"]
COPY ["src/SistemaVentasLO.Domain/SistemaVentasLO.Domain.csproj", "src/SistemaVentasLO.Domain/"]
COPY ["src/SistemaVentasLO.Infrastructure/SistemaVentasLO.Infrastructure.csproj", "src/SistemaVentasLO.Infrastructure/"]

RUN dotnet restore "src/SistemaVentasLO.WebApi/SistemaVentasLO.WebApi.csproj"

# Copiar código fuente completo y compilar
COPY . .
WORKDIR "/src/src/SistemaVentasLO.WebApi"
RUN dotnet build "SistemaVentasLO.WebApi.csproj" -c Release -o /app/build

# Stage 2: Publicación
FROM build AS publish
RUN dotnet publish "SistemaVentasLO.WebApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Imagen Final de Runtime Optimizada
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS final
WORKDIR /app
EXPOSE 8080

ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_RUNNING_IN_CONTAINER=true

# Crear usuario sin privilegios root por seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SistemaVentasLO.WebApi.dll"]
