# 📦 Configuración de Base de Datos - Control de Licorería

Esta guía te ayudará a configurar Supabase para tu aplicación de control de licorería.

## 🚀 Pasos para Configurar Supabase

### 1️⃣ Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Clic en **"New Project"**
4. Completa los datos:
   - **Name**: Control Licorería (o el nombre que prefieras)
   - **Database Password**: Elige una contraseña segura (guárdala bien)
   - **Region**: Elige la más cercana a República Dominicana (ej: South America)
5. Espera 2-3 minutos mientras Supabase crea tu proyecto

### 2️⃣ Obtener Credenciales

1. En tu proyecto de Supabase, ve a **Settings** (⚙️) > **API**
2. Copia los siguientes valores:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Una clave larga que comienza con `eyJ...`

### 3️⃣ Configurar Variables de Entorno

1. En la carpeta raíz del proyecto, abre el archivo `.env`
2. Reemplaza los valores con tus credenciales:

```env
VITE_SUPABASE_URL=https://tu-proyecto-real.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...tu-key-real
```

3. Guarda el archivo

### 4️⃣ Ejecutar Script de Base de Datos

1. En Supabase, ve a **SQL Editor** (icono de base de datos)
2. Clic en **"New Query"**
3. Abre el archivo `supabase-schema.sql` de este proyecto
4. Copia **TODO** el contenido del archivo
5. Pégalo en el SQL Editor de Supabase
6. Clic en **"Run"** o presiona `Ctrl + Enter`
7. Verifica que aparezca: ✅ **Success. No rows returned**

### 5️⃣ Verificar Tablas Creadas

1. Ve a **Table Editor** en Supabase
2. Deberías ver las siguientes tablas:
   - ✅ `profiles`
   - ✅ `clientes`
   - ✅ `transacciones`
   - ✅ `audit_logs`

### 6️⃣ Crear Usuario Administrador

Ahora necesitas crear tu primer usuario administrador:

1. Ve a **Authentication** > **Users** en Supabase
2. Clic en **"Add user"** > **"Create new user"**
3. Completa:
   - **Email**: tu-email@ejemplo.com
   - **Password**: Tu contraseña segura
   - **Auto Confirm User**: ✅ Activado
4. Clic en **"Create user"**

5. Luego, ve a **SQL Editor** y ejecuta este script (reemplaza el email):

```sql
-- Crear perfil de administrador
INSERT INTO public.profiles (id, email, role, full_name, is_active)
SELECT
    id,
    email,
    'admin' as role,
    'Administrador' as full_name,
    true as is_active
FROM auth.users
WHERE email = 'tu-email@ejemplo.com';
```

6. Clic en **"Run"**

### 7️⃣ (Opcional) Insertar Datos de Prueba

Si quieres datos de ejemplo para probar, ejecuta este script:

```sql
-- Insertar clientes de prueba
INSERT INTO public.clientes (nombre, telefono, direccion, saldo_total, ultima_compra) VALUES
('Juan Pérez', '809-555-0101', 'Calle Principal #123, Santo Domingo', 2500.00, NOW() - INTERVAL '4 days'),
('María García', '809-555-0102', 'Av. Independencia #456, Santiago', 1200.50, NOW() - INTERVAL '2 days'),
('Carlos Rodríguez', '809-555-0103', 'Calle Duarte #789, La Vega', 0, NOW() - INTERVAL '6 days'),
('Ana Martínez', '809-555-0104', 'Av. Estrella Sadhalá #321, Santiago', 3750.25, NOW() - INTERVAL '1 day'),
('Luis Hernández', '809-555-0105', 'Calle Sánchez #654, Puerto Plata', 500.00, NOW() - INTERVAL '2 days');

-- Insertar transacciones de ejemplo
INSERT INTO public.transacciones (cliente_id, tipo, monto, descripcion, fecha, metodo_pago)
SELECT
    c.id,
    'venta',
    1250.25,
    'Whisky Johnnie Walker Black Label',
    NOW() - INTERVAL '1 day',
    'efectivo'
FROM public.clientes c WHERE c.nombre = 'Ana Martínez';

INSERT INTO public.transacciones (cliente_id, tipo, monto, descripcion, fecha, metodo_pago)
SELECT
    c.id,
    'pago',
    500.00,
    'Pago parcial',
    NOW() - INTERVAL '3 hours',
    'transferencia'
FROM public.clientes c WHERE c.nombre = 'Juan Pérez';
```

## ✅ Verificar que Todo Funciona

Ejecuta esta consulta en SQL Editor:

```sql
SELECT * FROM get_dashboard_stats();
```

Deberías ver un resultado JSON con estadísticas:

```json
{
  "total_clientes": 5,
  "clientes_con_deuda": 4,
  "total_deudas": 7950.75,
  "pagos_hoy": 0,
  "ventas_hoy": 0
}
```

## 🔐 Seguridad (RLS - Row Level Security)

Las políticas de seguridad ya están configuradas:

- ✅ Los usuarios solo pueden ver datos autenticados
- ✅ Los moderadores pueden crear/editar clientes y transacciones
- ✅ Solo administradores pueden eliminar datos
- ✅ Solo administradores pueden gestionar usuarios
- ✅ Los usuarios pueden actualizar sus propias transacciones (24 horas)

## 🚀 Iniciar la Aplicación

Una vez configurado todo:

```bash
# Instalar dependencias (si no lo has hecho)
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Luego abre: `http://localhost:5173`

**Credenciales de inicio de sesión:**
- Email: El email que configuraste en el paso 6
- Contraseña: La contraseña que elegiste

## 📞 Solución de Problemas

### Error: "Invalid API key"
- Verifica que copiaste correctamente la `anon key` desde Supabase
- Asegúrate de que no tenga espacios al inicio/final

### Error: "relation does not exist"
- Asegúrate de haber ejecutado el script `supabase-schema.sql` completo
- Ve a Table Editor y verifica que las tablas existan

### Error: "No rows returned" al crear perfil
- Verifica que el email coincida exactamente con el usuario creado
- Ve a Authentication > Users y verifica que el usuario existe

### No puedo iniciar sesión
- Asegúrate de haber creado el perfil en la tabla `profiles`
- Verifica que `is_active = true`
- Verifica que el rol sea 'admin' o 'moderador'

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase SQL Editor](https://supabase.com/docs/guides/database/overview)

## 🎉 ¡Listo!

Ahora tu base de datos está completamente configurada y lista para usar. Puedes empezar a:

- ✅ Agregar clientes
- ✅ Registrar ventas
- ✅ Registrar pagos
- ✅ Ver estadísticas en tiempo real
- ✅ Gestionar usuarios (si eres admin)
