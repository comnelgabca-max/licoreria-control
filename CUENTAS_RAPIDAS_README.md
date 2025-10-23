# Sistema de Cuentas Rápidas - Guía de Instalación

## Descripción

El sistema de **Cuentas Rápidas** es un módulo de punto de venta para gestionar clientes que consumen en el momento (como en un bar/restaurante). Permite:

- Crear cuentas temporales sin guardar clientes fijos
- Agregar items/productos a la cuenta en tiempo real
- Ver el total acumulado
- Cerrar la cuenta cuando el cliente paga
- No se guardan como clientes permanentes

## Instalación en Supabase

### Paso 1: Ejecutar el Schema SQL

1. Abre tu proyecto de Supabase
2. Ve a **SQL Editor**
3. Copia y pega el contenido del archivo `supabase-cuentas-rapidas.sql`
4. Haz clic en **Run** para ejecutar el script

Este script creará:
- Tabla `cuentas_rapidas` (cuentas principales)
- Tabla `cuenta_items` (items/productos de cada cuenta)
- Índices para mejor rendimiento
- Funciones y triggers automáticos
- Políticas RLS (Row Level Security)
- Funciones útiles para estadísticas

### Paso 2: Verificar la Instalación

Ejecuta estas consultas en el SQL Editor para verificar:

```sql
-- Ver todas las tablas creadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('cuentas_rapidas', 'cuenta_items');

-- Probar las funciones
SELECT * FROM get_cuentas_abiertas();
SELECT * FROM get_cuentas_stats();
```

## Uso del Sistema

### Crear una Nueva Cuenta

1. Ve a **Cuentas Rápidas** en el menú
2. Haz clic en **"Nueva Cuenta"**
3. Ingresa el nombre del cliente (ej: "Juan")
4. Opcionalmente ingresa el número de mesa
5. Haz clic en **"Crear Cuenta"**

### Agregar Items a una Cuenta

1. Haz clic en la tarjeta de la cuenta abierta
2. En el formulario "Agregar Item":
   - **Descripción**: Nombre del producto (ej: "Cerveza Presidente")
   - **Cantidad**: Número de unidades (ej: 3)
   - **Precio**: Precio unitario (ej: 150)
3. Haz clic en **"Agregar"**
4. El total se actualiza automáticamente

### Cerrar una Cuenta (Marcar como Pagada)

1. Abre la cuenta haciendo clic en ella
2. Revisa que todos los items estén correctos
3. Haz clic en **"Marcar como Pagada"**
4. Selecciona el método de pago
5. Confirma el pago
6. La cuenta se cierra y desaparece de las cuentas abiertas

### Eliminar un Item (Corregir Error)

1. Abre la cuenta
2. En la lista de items, haz clic en **"Eliminar"** junto al item
3. Confirma la eliminación
4. El total se recalcula automáticamente

## Estadísticas

En la parte superior verás 4 tarjetas con:
- **Cuentas Abiertas**: Número de cuentas actualmente abiertas
- **Total Abierto**: Suma del dinero pendiente de cobrar
- **Pagadas Hoy**: Número de cuentas cerradas hoy
- **Total Pagado Hoy**: Total de dinero cobrado hoy

## Permisos

- **Admins y Moderadores**: Pueden crear, ver y cerrar cuentas
- **Todos**: Pueden agregar y eliminar items de cuentas abiertas
- **Solo Admins**: Pueden eliminar cuentas completas

## Base de Datos

### Tabla: cuentas_rapidas

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | ID único de la cuenta |
| nombre_cliente | TEXT | Nombre del cliente (no vinculado a tabla clientes) |
| mesa | TEXT | Número o ubicación de mesa (opcional) |
| estado | TEXT | 'abierta' o 'pagada' |
| total | DECIMAL | Total calculado automáticamente |
| metodo_pago | TEXT | efectivo, transferencia, tarjeta, otro |
| fecha_apertura | TIMESTAMP | Cuando se creó la cuenta |
| fecha_cierre | TIMESTAMP | Cuando se marcó como pagada |

### Tabla: cuenta_items

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | ID único del item |
| cuenta_id | UUID | Referencia a la cuenta |
| descripcion | TEXT | Nombre del producto/item |
| cantidad | INTEGER | Número de unidades |
| precio_unitario | DECIMAL | Precio por unidad |
| subtotal | DECIMAL | Calculado automáticamente (cantidad × precio) |

## Funcionalidades Automáticas

### Cálculo de Totales
- El total de la cuenta se actualiza automáticamente cuando:
  - Se agrega un nuevo item
  - Se modifica un item existente
  - Se elimina un item

### Triggers de Auditoría
- Todos los cambios se registran en la tabla `audit_logs`
- Incluye quién hizo el cambio y cuándo

### Row Level Security (RLS)
- Solo usuarios autenticados pueden ver y modificar cuentas
- Los datos están protegidos a nivel de base de datos

## Archivos Creados

```
licoreria-control/
├── supabase-cuentas-rapidas.sql          # Schema de base de datos
├── src/
│   ├── services/
│   │   └── cuentasRapidasService.js      # Servicio API
│   └── pages/
│       └── CuentasRapidas.jsx            # Interfaz de usuario
├── CUENTAS_RAPIDAS_README.md             # Esta guía
```

## Solución de Problemas

### No se ven las cuentas
- Verifica que ejecutaste el script SQL correctamente
- Revisa que las políticas RLS estén habilitadas
- Verifica que estés autenticado

### El total no se actualiza
- Los triggers deberían actualizar automáticamente
- Verifica en SQL Editor:
  ```sql
  SELECT * FROM cuenta_items WHERE cuenta_id = 'tu-cuenta-id';
  ```

### Error al crear cuenta
- Verifica que el nombre del cliente no esté vacío
- Revisa la consola del navegador para más detalles

## Soporte

Si tienes problemas o preguntas:
1. Revisa los logs en la consola del navegador
2. Verifica los logs de Supabase en el Dashboard
3. Revisa que todas las tablas y funciones se crearon correctamente
