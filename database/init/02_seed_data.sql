-- ==============================================================================
-- SISTEMA_VENTAS_LO - DATOS SEMILLA INICIALES (Seed Data)
-- Para entornos Staging y Development (Aislado de Producción)
-- ==============================================================================

-- 1. ROLES DEL SISTEMA
INSERT INTO roles (id, nombre, descripcion) VALUES
(1, 'ADMIN', 'Administrador directivo con acceso completo a gestión financiera y operativa'),
(2, 'VENDEDOR', 'Operador de punto de venta y emisión móvil en calle')
ON CONFLICT (id) DO NOTHING;

-- 2. ZONAS COMERCIALES Y COEFICIENTES DE PREMIO
INSERT INTO zonas (id, nombre, coeficiente_premio, estado) VALUES
(1, 'Zona El Recreo', 80.00, TRUE),
(2, 'Zona Central', 85.00, TRUE),
(3, 'Zona Norte', 90.00, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. HORARIOS OFICIALES DE SORTEO (Reglas de Tiempo del Negocio)
INSERT INTO horarios_configuracion (id, nombre, hora_cierre, dias_semana, minutos_bloqueo_previo, minutos_reapertura_posterior, activo) VALUES
(1, 'Sorteo Matutino (11:00 AM)', '11:00:00', 'L,M,X,J,V,S,D', 5, 10, TRUE),
(2, 'Sorteo Vespertino (03:00 PM)', '15:00:00', 'L,M,X,J,V,S,D', 5, 10, TRUE),
(3, 'Sorteo Tarde (06:00 PM)', '18:00:00', 'L,M,X,J,V,S,D', 5, 10, TRUE),
(4, 'Sorteo Nocturno (09:00 PM)', '21:00:00', 'L,M,X,J,V,S,D', 5, 10, TRUE),
(5, 'Lotería Especial (Martes 09:00 PM)', '21:00:00', 'M', 5, 10, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 4. USUARIOS INICIALES (Contraseñas cifradas con algoritmo BCrypt mediante pgcrypto)
-- Credencial Admin: admin / Admin123*
-- Credencial Vendedor: vendedor1 / Vendedor123*
INSERT INTO usuarios (
    id, cedula, nombres, apellidos, celular, direccion, username, password_hash, rol_id, zona_id, precio_base, precio_venta, saldo_credito, estado
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    '001-000000-0001A',
    'Super',
    'Administrador',
    '+505 8888-8888',
    'Oficina Principal',
    'admin',
    crypt('Admin123*', gen_salt('bf', 11)),
    1,
    NULL,
    0.00,
    0.00,
    0.00,
    TRUE
), (
    'b0000000-0000-0000-0000-000000000002',
    '001-120595-0002B',
    'Juan',
    'Pérez Vendedor',
    '+505 8999-9999',
    'Sector El Recreo, Puesto 4',
    'vendedor1',
    crypt('Vendedor123*', gen_salt('bf', 11)),
    2,
    1, -- Vinculado a Zona El Recreo (Coeficiente 80.00)
    15.00,
    20.00,
    1000.00, -- Saldo de crédito operativo inicial
    TRUE
)
ON CONFLICT (username) DO NOTHING;

-- 5. REGISTRO DE SALDO INICIAL EN AUDITORÍA
INSERT INTO transacciones_saldo (
    vendedor_id, operador_id, tipo_movimiento, monto, saldo_anterior, saldo_posterior, concepto
) VALUES (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'RECARGA_CREDITO',
    1000.00,
    0.00,
    1000.00,
    'Carga inicial de saldo operativo para pruebas en Staging'
);
