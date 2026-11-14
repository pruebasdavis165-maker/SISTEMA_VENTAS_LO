-- ==============================================================================
-- SISTEMA_VENTAS_LO - ESQUEMA RELACIONAL PRINCIPAL (PostgreSQL 16)
-- Clean Architecture - Módulo de Persistencia y Dominio
-- ==============================================================================

-- Habilitar extensión para generación de identificadores UUID y funciones criptográficas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. FUNCIONES Y DISPARADORES AUXILIARES
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==============================================================================
-- 2. TABLAS DE SEGURIDAD Y CONTROL DE ACCESO (RBAC)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zonas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    coeficiente_premio NUMERIC(6, 2) NOT NULL CHECK (coeficiente_premio > 0),
    estado BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_zonas_updated_at
BEFORE UPDATE ON zonas
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cedula VARCHAR(20) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    celular VARCHAR(20),
    direccion VARCHAR(250),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INT NOT NULL REFERENCES roles(id),
    zona_id INT REFERENCES zonas(id) ON DELETE RESTRICT,
    precio_base NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (precio_base >= 0),
    precio_venta NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (precio_venta >= precio_base),
    saldo_credito NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (saldo_credito >= 0),
    estado BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_usuarios_updated_at
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auditoría de Movimientos Financieros y Recargas de Saldo
CREATE TABLE IF NOT EXISTS transacciones_saldo (
    id BIGSERIAL PRIMARY KEY,
    vendedor_id UUID NOT NULL REFERENCES usuarios(id),
    operador_id UUID REFERENCES usuarios(id),
    tipo_movimiento VARCHAR(30) NOT NULL CHECK (tipo_movimiento IN ('RECARGA_CREDITO', 'VENTA_BOLETO', 'ANULACION_BOLETO', 'AJUSTE_ADMIN', 'LIQUIDACION')),
    monto NUMERIC(12, 2) NOT NULL,
    saldo_anterior NUMERIC(12, 2) NOT NULL,
    saldo_posterior NUMERIC(12, 2) NOT NULL,
    concepto VARCHAR(250),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 3. GESTIÓN DE HORARIOS Y SORTEOS (CORE DEL NEGOCIO)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS horarios_configuracion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    hora_cierre TIME NOT NULL,
    dias_semana VARCHAR(50) NOT NULL DEFAULT 'L,M,X,J,V,S,D',
    minutos_bloqueo_previo INT NOT NULL DEFAULT 5 CHECK (minutos_bloqueo_previo >= 1),
    minutos_reapertura_posterior INT NOT NULL DEFAULT 10 CHECK (minutos_reapertura_posterior >= 1),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sorteos (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    fecha DATE NOT NULL,
    hora_cierre TIMESTAMP WITH TIME ZONE NOT NULL,
    zona_id INT REFERENCES zonas(id), -- NULL si es abierto a todas las zonas
    horario_configuracion_id INT REFERENCES horarios_configuracion(id),
    estado VARCHAR(30) NOT NULL DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO', 'BLOQUEADO_VENTA', 'CERRADO_PENDIENTE_GANADOR', 'LIQUIDADO', 'CANCELADO')),
    numero_ganador VARCHAR(2) CHECK (numero_ganador ~ '^[0-9]{2}$'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_sorteos_updated_at
BEFORE UPDATE ON sorteos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 4. CONTROL DE RIESGOS (CORTES Y BLOQUEOS DE NÚMEROS 00-99)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS bloqueos_numeros (
    id BIGSERIAL PRIMARY KEY,
    sorteo_id BIGINT NOT NULL REFERENCES sorteos(id) ON DELETE CASCADE,
    numero VARCHAR(2) NOT NULL CHECK (numero ~ '^[0-9]{2}$'),
    alcance VARCHAR(20) NOT NULL DEFAULT 'GLOBAL' CHECK (alcance IN ('GLOBAL', 'POR_ZONA', 'POR_VENDEDOR')),
    zona_id INT REFERENCES zonas(id),
    vendedor_id UUID REFERENCES usuarios(id),
    monto_limite NUMERIC(12,2) DEFAULT 0,
    motivo VARCHAR(250),
    creado_por UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 5. TRANSACCIONES DE VENTAS (BOLETOS Y DETALLE DE JUGADAS)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS boletos (
    id BIGSERIAL PRIMARY KEY,
    numero_boleto VARCHAR(50) NOT NULL UNIQUE,
    codigo_validacion VARCHAR(64) NOT NULL UNIQUE,
    vendedor_id UUID NOT NULL REFERENCES usuarios(id),
    sorteo_id BIGINT NOT NULL REFERENCES sorteos(id),
    zona_id INT NOT NULL REFERENCES zonas(id),
    total_apostado NUMERIC(12, 2) NOT NULL CHECK (total_apostado > 0),
    total_premio_estimado NUMERIC(12, 2) NOT NULL CHECK (total_premio_estimado >= 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'ANULADO', 'PAGADO', 'NO_PREMIADO')),
    copias_impresas INT NOT NULL DEFAULT 0 CHECK (copias_impresas >= 0),
    fecha_emision TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_caducidad_cobro TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_boletos_updated_at
BEFORE UPDATE ON boletos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS detalle_jugadas (
    id BIGSERIAL PRIMARY KEY,
    boleto_id BIGINT NOT NULL REFERENCES boletos(id) ON DELETE CASCADE,
    sorteo_id BIGINT NOT NULL REFERENCES sorteos(id),
    numero VARCHAR(2) NOT NULL CHECK (numero ~ '^[0-9]{2}$'),
    monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
    coeficiente_congelado NUMERIC(6, 2) NOT NULL CHECK (coeficiente_congelado > 0),
    premio_calculado NUMERIC(12, 2) NOT NULL CHECK (premio_calculado >= 0),
    es_ganador BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 6. LIQUIDACIÓN FINANCIERA DE SORTEOS Y GANANCIAS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS liquidaciones (
    id BIGSERIAL PRIMARY KEY,
    sorteo_id BIGINT NOT NULL UNIQUE REFERENCES sorteos(id),
    numero_ganador VARCHAR(2) NOT NULL CHECK (numero_ganador ~ '^[0-9]{2}$'),
    venta_total NUMERIC(14, 2) NOT NULL,
    premio_total NUMERIC(14, 2) NOT NULL,
    diferencia_bruta NUMERIC(14, 2) NOT NULL,
    comision_vendedores_total NUMERIC(14, 2) NOT NULL,
    ganancia_neta_empresa NUMERIC(14, 2) NOT NULL,
    liquidado_por UUID NOT NULL REFERENCES usuarios(id),
    fecha_liquidacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detalle_liquidaciones_vendedor (
    id BIGSERIAL PRIMARY KEY,
    liquidacion_id BIGINT NOT NULL REFERENCES liquidaciones(id) ON DELETE CASCADE,
    vendedor_id UUID NOT NULL REFERENCES usuarios(id),
    venta_vendedor NUMERIC(12, 2) NOT NULL,
    comision_vendedor NUMERIC(12, 2) NOT NULL,
    premios_en_punto NUMERIC(12, 2) NOT NULL,
    balance_neto NUMERIC(12, 2) NOT NULL
);

-- ==============================================================================
-- 7. ÍNDICES DE ALTO RENDIMIENTO
-- ==============================================================================

-- Búsqueda de boletos por código de validación y número de ticket
CREATE INDEX idx_boletos_codigo_val ON boletos(codigo_validacion);
CREATE INDEX idx_boletos_numero_boleto ON boletos(numero_boleto);
CREATE INDEX idx_boletos_vendedor_sorteo ON boletos(vendedor_id, sorteo_id);

-- Agregación en tiempo real para la cuadrícula 00-99 (CU04 / Monitoreo)
CREATE INDEX idx_jugadas_sorteo_numero ON detalle_jugadas(sorteo_id, numero);
CREATE INDEX idx_jugadas_boleto ON detalle_jugadas(boleto_id);

-- Búsqueda de bloqueos de números activos
CREATE INDEX idx_bloqueos_sorteo_numero ON bloqueos_numeros(sorteo_id, numero);

-- Sorteos activos por estado y fecha
CREATE INDEX idx_sorteos_estado_fecha ON sorteos(estado, fecha);
