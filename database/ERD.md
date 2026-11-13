# Diagrama Entidad-Relación (ERD) - SISTEMA_VENTAS_LO

## 1. Diagrama de Entidades y Relaciones

```mermaid
erDiagram
    ROLES ||--o{ USUARIOS : "asigna rol"
    ZONAS ||--o{ USUARIOS : "pertenece a sucursal"
    USUARIOS ||--o{ TRANSACCIONES_SALDO : "recibe movimiento"
    USUARIOS ||--o{ TRANSACCIONES_SALDO : "autoriza movimiento"
    
    ZONAS ||--o{ SORTEOS : "aplica a"
    HORARIOS_CONFIGURACION ||--o{ SORTEOS : "define regla horaria"
    
    SORTEOS ||--o{ BLOQUEOS_NUMEROS : "controla riesgo en"
    ZONAS ||--o{ BLOQUEOS_NUMEROS : "bloqueo territorial"
    USUARIOS ||--o{ BLOQUEOS_NUMEROS : "bloqueo vendedor"
    
    USUARIOS ||--o{ BOLETOS : "emite venta"
    SORTEOS ||--o{ BOLETOS : "pertenece a sorteo"
    ZONAS ||--o{ BOLETOS : "origen comercial"
    
    BOLETOS ||--|{ DETALLE_JUGADAS : "contiene jugadas"
    SORTEOS ||--|{ DETALLE_JUGADAS : "apuesta a"
    
    SORTEOS ||--o| LIQUIDACIONES : "cierra con resultado"
    LIQUIDACIONES ||--|{ DETALLE_LIQUIDACIONES_VENDEDOR : "desglosa comision"
    USUARIOS ||--o{ DETALLE_LIQUIDACIONES_VENDEDOR : "balance vendedor"

    ROLES {
        int id PK
        string nombre UK
        string descripcion
    }

    ZONAS {
        int id PK
        string nombre UK
        numeric coeficiente_premio
        boolean estado
    }

    USUARIOS {
        uuid id PK
        string cedula UK
        string nombres
        string apellidos
        string username UK
        string password_hash
        int rol_id FK
        int zona_id FK
        numeric precio_base
        numeric precio_venta
        numeric saldo_credito
        boolean estado
    }

    TRANSACCIONES_SALDO {
        bigint id PK
        uuid vendedor_id FK
        uuid operador_id FK
        string tipo_movimiento
        numeric monto
        numeric saldo_anterior
        numeric saldo_posterior
        string concepto
    }

    HORARIOS_CONFIGURACION {
        int id PK
        string nombre
        time hora_cierre
        string dias_semana
        int minutos_bloqueo_previo
        int minutos_reapertura_posterior
        boolean activo
    }

    SORTEOS {
        bigint id PK
        string codigo UK
        date fecha
        timestamp hora_cierre
        int zona_id FK
        int horario_configuracion_id FK
        string estado
        string numero_ganador
    }

    BLOQUEOS_NUMEROS {
        bigint id PK
        bigint sorteo_id FK
        string numero
        string alcance
        int zona_id FK
        uuid vendedor_id FK
        string motivo
    }

    BOLETOS {
        bigint id PK
        string numero_boleto UK
        string codigo_validacion UK
        uuid vendedor_id FK
        bigint sorteo_id FK
        int zona_id FK
        numeric total_apostado
        numeric total_premio_estimado
        string estado
        int copias_impresas
        timestamp fecha_emision
        timestamp fecha_caducidad_cobro
    }

    DETALLE_JUGADAS {
        bigint id PK
        bigint boleto_id FK
        bigint sorteo_id FK
        string numero
        numeric monto
        numeric coeficiente_congelado
        numeric premio_calculado
        boolean es_ganador
    }

    LIQUIDACIONES {
        bigint id PK
        bigint sorteo_id FK
        string numero_ganador
        numeric venta_total
        numeric premio_total
        numeric diferencia_bruta
        numeric comision_vendedores_total
        numeric ganancia_neta_empresa
        uuid liquidado_por FK
        timestamp fecha_liquidacion
    }

    DETALLE_LIQUIDACIONES_VENDEDOR {
        bigint id PK
        bigint liquidacion_id FK
        uuid vendedor_id FK
        numeric venta_vendedor
        numeric comision_vendedor
        numeric premios_en_punto
        numeric balance_neto
    }
```

---

## 2. Diccionario de Datos y Reglas de Negocio Clave

### A. Coeficiente de Premio y Congelamiento
* Al registrar un boleto, el campo `coeficiente_congelado` en `detalle_jugadas` almacena el valor vigente de la zona del vendedor en ese milisegundo exacto.
* Si el administrador modifica el coeficiente de una zona posteriormente (CU01), los boletos ya emitidos conservan su cálculo original inmutable.

### B. Validación Estricta de Dígitos (00-99)
* Las columnas de números de jugada (`detalle_jugadas.numero`), sorteos (`sorteos.numero_ganador`) y bloqueos (`bloqueos_numeros.numero`) cuentan con restricción:
  ```sql
  CHECK (numero ~ '^[0-9]{2}$')
  ```
  Esto garantiza siempre formato de 2 caracteres (`00`, `01` ... `99`).

### C. Control de Límites de Riesgo (CU04)
* Índice compuesto `idx_jugadas_sorteo_numero (sorteo_id, numero)` para sumarizar el dinero acumulado en milisegundos en la consulta de la cuadrícula global.
* Verificación previa contra la tabla `bloqueos_numeros` antes de permitir la inserción de jugadas.

### D. Protocolo Antifraude en Impresión Térmica (CU09)
* La columna `copias_impresas` en `boletos` inicia en `0` (Ticket Original).
* Cada reimpresión invoca un trigger/update que incrementa el contador (+1) e inyecta la marca de agua `COPIA X`.

### E. Integridad Transaccional de Saldo y Cierre (CU05, CU08)
* Toda emisión descuenta de `usuarios.saldo_credito`.
* Toda anulación antes de los 5 minutos de cierre devuelve el importe al saldo y registra la traza en `transacciones_saldo`.
* La liquidación genera el balance vendedor en `detalle_liquidaciones_vendedor` calculando la ganancia según `precio_venta - precio_base`.
