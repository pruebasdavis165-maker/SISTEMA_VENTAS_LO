@echo off
title SISTEMA VENTAS LO - Lanzador
cls
echo ===================================================
echo             SISTEMA VENTAS LO
echo ===================================================
echo.
echo Iniciando servicios con Docker Compose...
echo.

docker compose up -d --build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] No se pudo iniciar Docker Compose.
    echo Asegurate de que Docker Desktop este abierto y ejecutandose.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [OK] Servicios iniciados con exito.
echo.
echo Abriendo navegador en la plataforma web...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo Acceso Web: http://localhost:3000
echo Acceso API / Swagger: http://localhost:5000/swagger
echo.
echo Presiona cualquier tecla para salir de esta ventana (los servicios continuaran ejecutandose).
pause >nul
