# SISTEMA_VENTAS_LO

Plataforma cliente-servidor de alta disponibilidad para gestión transaccional, control operativo y reportería financiera.

---

## 🏗️ Arquitectura del Sistema

El ecosistema está construido bajo una arquitectura multicapa desacoplada y contenerizada:

- **Backend:** .NET 8 Web API con Clean Architecture (Domain, Application, Infrastructure, WebApi), CQRS mediante MediatR, Entity Framework Core y validaciones fluidas (FluentValidation).
- **Base de Datos:** PostgreSQL con esquemas relacionales normalizados, índices B-Tree para consultas concurrentes de alta frecuencia y transaccionalidad ACID.
- **Frontend Web:** React 18 con Vite, TypeScript, TailwindCSS, Zustand y Lucide Icons para el panel administrativo.
- **Aplicación Móvil:** React Native (Bare workflow / CLI) con TypeScript, React Navigation, NativeWind y comunicación Bluetooth para terminales portátiles.
- **DevOps:** Docker Compose con perfiles para desarrollo, Staging y pipeline automatizado en GitHub Actions con dos entornos aislados.

---

## 🚀 Requisitos Previos

Asegúrate de tener instalados los siguientes componentes en tu máquina local:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (con Docker Compose v2+)
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js](https://nodejs.org/) (versión 20 LTS o 22 LTS)
- [Git](https://git-scm.com/)

---

## ⚡ Inicio Rápido (Levantamiento con Docker)

La forma más rápida de ejecutar el ecosistema completo (Base de Datos, Backend y Frontend Web) es mediante Docker Compose:

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/pruebasdavis165-maker/SISTEMA_VENTAS_LO.git
   cd SISTEMA_VENTAS_LO
   ```

2. **Iniciar todos los servicios:**
   ```bash
   docker compose up -d --build
   ```

3. **Verificar el estado de los contenedores:**
   ```bash
   docker compose ps
   ```

4. **Acceder a los servicios:**
   - **Frontend Web Administrativo:** `http://localhost:5173`
   - **Backend API & Swagger:** `http://localhost:5000/swagger`
   - **Base de Datos PostgreSQL:** `localhost:5432` (Base de datos: `ventas_lo_db`)

---

## 🛠️ Levantamiento Local para Desarrollo

Si deseas ejecutar y depurar los proyectos directamente sin contenedores:

### 1. Base de Datos (PostgreSQL)
Puedes usar el servicio de PostgreSQL de Docker:
```bash
docker compose up -d postgres
```

### 2. Backend (.NET 8 Web API)
```bash
cd backend
dotnet restore
dotnet build SistemaVentasLO.sln
dotnet run --project src/SistemaVentasLO.WebApi
```
La API estará disponible en `http://localhost:5000` y Swagger en `http://localhost:5000/swagger`.

### 3. Frontend Web (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
La aplicación web estará disponible en `http://localhost:5173`.

---

## 📖 Guía de Uso del Sistema

### 🔐 1. Autenticación y Control de Acceso (RBAC)
- **Roles del Sistema:**
  - `ADMIN`: Acceso completo a parametrización, zonas, vendedores, programación de sorteos, matrices de riesgo y liquidación contable.
  - `VENDEDOR`: Acceso operativo a emisión de boletos, consulta de límites, historial de turno y liquidación en punto.
- Inicia sesión con credenciales autorizadas para obtener el token JWT que protege todas las rutas y peticiones.

### 🏢 2. Gestión de Zonas y Parámetros
- Navega a **Zonas** para definir las demarcaciones comerciales y configurar los coeficientes multiplicadores aplicables a las jugadas emitidas en cada territorio.

### 👥 3. Gestión de Vendedores y Saldos
- Accede al módulo de **Vendedores** para dar de alta usuarios de calle, asignar su zona comercial, fijar sus comisiones de venta y realizar recargas de saldo o cupo operativo en tiempo real.

### ⏱️ 4. Programación y Monitoreo de Sorteos
- Desde el módulo de **Sorteos** se gestionan las rondas diarias programadas (11:00 AM, 3:00 PM, 6:00 PM, 9:00 PM) y sorteos extraordinarios.
- **Regla de Congelamiento Automático:** Las ventas se bloquean estrictamente 5 minutos antes de la hora fijada del sorteo.
- **Reapertura:** Las ventas se reanudan 10 minutos posteriores a la conclusión de la ronda.

### 🛡️ 5. Matriz de Control de Riesgos (00-99)
- El panel de **Control de Riesgo** renderiza una cuadrícula 10x10 (posiciones `00` a `99`) con mapa de calor del dinero apostado.
- Permite a los directores aplicar bloqueos preventivos (Globales o por Zona) sobre números específicos para limitar la exposición financiera de la empresa.

### 🏆 6. Cierre y Liquidación Oficial
- Al concluir una ronda, el administrador ingresa el número ganador oficial de dos dígitos (`00` a `99`) en el módulo de **Liquidación**.
- El motor clasifica automáticamente las jugadas en `PREMIADO` o `NO_PREMIADO` (con ventana de 30 días para reclamo), liquida comisiones comerciales y descuenta los balances correspondientes del saldo del vendedor.

### 🧾 7. Auditoría y Control Antifraude
- En el módulo de **Auditoría**, consulta y busca cualquier boleto mediante su identificador o código hash único.
- El visor de recibo permite generar reimpresiones térmicas, incrementando secuencialmente el contador oficial con las leyendas reglamentarias `COPIA 1`, `COPIA 2`, evitando reclamos duplicados.

---

## 🧪 Ejecución de Pruebas y Compilación

- **Compilar backend:**
  ```bash
  dotnet build backend/SistemaVentasLO.sln
  ```
- **Validar TypeScript y compilar frontend:**
  ```bash
  cd frontend
  npm run build
  ```

---

## 🔒 Protocolo de Desarrollo y CI/CD
- **Flujo de Git:** Todo cambio se desarrolla en ramas de feature aisladas (`feature/<numero>-<descripcion>`) creadas a partir de un Issue.
- **Commits Semánticos:** Se exige el formato `feat:`, `fix:`, `chore:`, `ci:`, `test:`.
- **Merge Seguro:** Todo Pull Request hacia `main` debe superar la compilación automatizada en GitHub Actions y cerrar su issue correspondiente mediante `Closes #<numero>`.
- **Despliegue Continuo:**
  - **Planeta Staging:** Despliegue automático tras fusión en `main` con base de datos de pruebas aislada.
  - **Planeta Producción:** Despliegue protegido que requiere aprobación manual e inyección de credenciales seguras.
