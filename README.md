# SISTEMA VENTAS LO

Plataforma transaccional de alta disponibilidad para gestión operativa, control de límites y reportería contable.

---

## Modos de Ejecución y Levantamiento

### 1. Ejecución Rápida con Doble Clic (Windows)
Puedes iniciar todo el sistema con un solo clic utilizando cualquiera de los siguientes lanzadores incluidos en la raíz:
- **`Launcher.exe`**: Ejecutable portable independiente.
- **`iniciar-sistema.bat`**: Script automatizado por lotes.

Ambos comandos inician los contenedores, configuran la base de datos y abren automáticamente la aplicación en tu navegador.

---

### 2. Levantamiento con Docker Compose (Recomendado)
Para desplegar y compilar todos los servicios en segundo plano:

```bash
docker compose up -d --build
```

#### Puertos y Direcciones de Acceso
- **Plataforma Web Administrativa:** [http://localhost:3000](http://localhost:3000)
- **API REST & Documentación Swagger:** [http://localhost:5000/swagger](http://localhost:5000/swagger)
- **Base de Datos PostgreSQL:** `localhost:5432` (Base de datos: `ventas_lo_db`)
- **pgAdmin (Opcional):** [http://localhost:5050](http://localhost:5050)

#### Credenciales Administrativas por Defecto
- **Usuario:** `admin`
- **Contraseña:** `Admin123*`

---

### 3. Levantamiento Local para Desarrollo (Sin Contenedores)

#### Base de Datos
```bash
docker compose up -d postgres
```

#### Backend (.NET 8 Web API)
```bash
cd backend
dotnet restore
dotnet build SistemaVentasLO.sln
dotnet run --project src/SistemaVentasLO.WebApi
```
Acceso a la API: `http://localhost:5000/swagger`

#### Frontend Web (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Acceso al panel: `http://localhost:5173`

---

## Módulos y Capacidades del Sistema

### Apariencia y Accesibilidad (Modo Claro / Modo Oscuro)
- El sistema cuenta con un conmutador integrado de **Modo Oscuro** y **Modo Claro** en la barra superior.
- Paleta visual sólida de alto contraste, sin degradados, con tipografías legibles y selectores de formulario nativos estilizados.

### Gestión de Zonas y Coeficientes
- Definición de sucursales o zonas comerciales.
- Calibración de coeficientes multiplicadores con validación estricta de hasta **99.00**.
- Activación y desactivación inmediata de zonas directamente desde la tabla o mediante el modal de edición.

### Control de Vendedores y Esquema de Ganancias
- **Venta Abierta:** Los operadores de calle no requieren prepago de saldo para emitir boletos.
- **Esquema de Comisión por Porcentaje (%):** Las ganancias del vendedor se calculan sobre el volumen total vendido (por ejemplo, con 10% de comisión sobre $2,000 vendidos, la comisión es $200).
- **Limitadores por Número:** El administrador puede asignar topes máximos de dinero permitidos por número (a todos los dígitos o números individuales específicos como el 00, 10 o 92).
- **Validación Oficial de Nicaragua:** Validación de formato oficial de Cédula (ej. `001-120595-0002B`) y números telefónicos de 8 dígitos sin prefijo internacional.

### Sorteos y Ventas Adelantadas
- **Generación Automática a las 5:00 AM:** Un servicio en segundo plano programa automáticamente los horarios del día.
- **Venta Adelantada:** Los vendedores pueden emitir boletos para cualquier sorteo programado del día (por ejemplo, vender a las 8:00 AM para la ronda de las 9:00 PM).
- **Control de Horarios y Bloqueo:** Edición de hora de cierre y bloqueo preventivo automático 5 minutos antes del turno.

### Matriz de Control de Riesgo 00-99
- Visualización de las 100 posiciones numéricas organizada en **4 columnas estructurales**:
  - **Columna 1:** 00 al 24
  - **Columna 2:** 25 al 49
  - **Columna 3:** 50 al 74
  - **Columna 4:** 75 al 99
- Mapa de intensidades de riesgo por volumen recaudado y bloqueo preventivo de números con un solo clic.

### Cierre Oficial y Liquidación Financiera
- Declaración del número ganador oficial (00 al 99).
- Liquidación automática: cálculo de premios pagados, comisiones comerciales devengadas y rentabilidad neta final.

### Auditoría y Control de Copias
- Búsqueda y trazabilidad de boletos mediante identificador y hash criptográfico.
- Módulo de reimpresión reglamentaria con marcas progresivas (`COPIA 1`, `COPIA 2`) para control antifraude.

---

## Compilación y Pruebas

- **Compilar backend (.NET 8):**
  ```bash
  dotnet build backend/SistemaVentasLO.sln
  ```
- **Ejecutar pruebas unitarias:**
  ```bash
  dotnet test backend/SistemaVentasLO.sln
  ```
- **Compilar frontend (TypeScript + Vite):**
  ```bash
  cd frontend
  npm run build
  ```
