-- ==============================================================================
-- SISTEMA VENTAS LO - SEED Y ESQUEMA OFICIAL PARA PLANETA PRODUCCIÓN
-- Base de Datos: PostgreSQL 16+
-- Cero datos ficticios. Configuración de arranque corporativo en frío.
-- ==============================================================================

-- 1. Zona Central Matriz por Defecto
INSERT INTO "Zonas" ("Nombre", "CoeficientePremio", "Estado", "CreatedAt")
SELECT 'Zona Central Corporativa', 70.00, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Zonas" WHERE "Id" = 1);

-- 2. Horarios Oficiales de Sorteo Diario
INSERT INTO "HorariosConfiguracion" ("Nombre", "HoraCierre", "DiasSemana", "MinutosBloqueoPrevio", "MinutosReaperturaPosterior", "Activo", "CreatedAt")
SELECT 'Sorteo Matutino', '11:00:00', 'L,M,X,J,V,S,D', 5, 10, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "HorariosConfiguracion" WHERE "Nombre" = 'Sorteo Matutino');

INSERT INTO "HorariosConfiguracion" ("Nombre", "HoraCierre", "DiasSemana", "MinutosBloqueoPrevio", "MinutosReaperturaPosterior", "Activo", "CreatedAt")
SELECT 'Sorteo Vespertino', '15:00:00', 'L,M,X,J,V,S,D', 5, 10, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "HorariosConfiguracion" WHERE "Nombre" = 'Sorteo Vespertino');

INSERT INTO "HorariosConfiguracion" ("Nombre", "HoraCierre", "DiasSemana", "MinutosBloqueoPrevio", "MinutosReaperturaPosterior", "Activo", "CreatedAt")
SELECT 'Sorteo Nocturno', '18:00:00', 'L,M,X,J,V,S,D', 5, 10, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "HorariosConfiguracion" WHERE "Nombre" = 'Sorteo Nocturno');

INSERT INTO "HorariosConfiguracion" ("Nombre", "HoraCierre", "DiasSemana", "MinutosBloqueoPrevio", "MinutosReaperturaPosterior", "Activo", "CreatedAt")
SELECT 'Sorteo Extraordinario', '21:00:00', 'L,M,X,J,V,S,D', 5, 10, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "HorariosConfiguracion" WHERE "Nombre" = 'Sorteo Extraordinario');

-- 3. Verificación de Índices Críticos para Alta Concurrencia
CREATE INDEX IF NOT EXISTS "IX_Boletos_SorteoId_Estado" ON "Boletos" ("SorteoId", "Estado");
CREATE INDEX IF NOT EXISTS "IX_Boletos_VendedorId_FechaEmision" ON "Boletos" ("VendedorId", "FechaEmision");
CREATE INDEX IF NOT EXISTS "IX_DetalleJugada_Numero_SorteoId" ON "DetalleJugadas" ("Numero", "SorteoId");
CREATE INDEX IF NOT EXISTS "IX_BloqueoNumero_SorteoId_Numero" ON "BloqueosNumeros" ("SorteoId", "Numero");
