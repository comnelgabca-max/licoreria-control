# Configuración de Gestión de Usuarios

Guía para configurar la creación de usuarios administradores en Supabase.

---

## ⚠️ IMPORTANTE: Configuración de Service Role Key

Para crear usuarios desde tu aplicación, necesitas usar la **Service Role Key** (solo para admins del lado del servidor).

### Opción 1: Usar Edge Functions (Recomendado - Más Seguro)

Esta es la forma más segura ya que la Service Role Key nunca se expone al cliente.

1. **Crear Edge Function en Supabase**:
   - Ve a **Edge Functions** en Supabase
   - Crea una nueva función llamada `create-user`
   - Implementa la lógica de creación de usuarios

2. **Llamar a la función desde tu app**:
   ```javascript
   const { data, error } = await supabase.functions.invoke('create-user', {
     body: { email, password, fullName, role }
   });
   ```

### Opción 2: Service Role Key en Backend (Alternativa)

Si tienes un backend Node.js, puedes usar la Service Role Key allí.

1. Crea un endpoint en tu backend
2. Usa la Service Role Key solo en el servidor
3. Llama a ese endpoint desde tu app React

### Opción 3: Service Role Key en Frontend (SOLO DESARROLLO - NO RECOMENDADO PARA PRODUCCIÓN)

⚠️ **ADVERTENCIA**: Esto NO es seguro para producción ya que expone tu Service Role Key en el cliente.

1. Ve a tu proyecto en Supabase
2. **Settings** → **API**
3. Copia la **service_role key** (secret)
4. Crea un archivo `.env.local`:

```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

5. **Modifica `src/services/supabase.js`** para tener dos clientes:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Cliente normal (para usuarios)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Cliente con permisos de admin (solo para crear usuarios)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const auth = supabase.auth;
export const db = supabase;
```

6. **Modifica `src/services/usuariosService.js`**:

```javascript
import { supabase, supabaseAdmin } from './supabase';

// En la función createUsuario, cambia:
const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
  // ... resto del código
});
```

---

## 📋 Verificar tabla `profiles`

Asegúrate de que existe la tabla `profiles` con esta estructura:

```sql
-- Crear tabla profiles si no existe
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'moderador' CHECK (role IN ('admin', 'moderador')),
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Índice para filtrar por rol
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver perfiles
CREATE POLICY "Usuarios autenticados pueden ver perfiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Solo admins pueden crear perfiles
CREATE POLICY "Solo admins pueden crear perfiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: Solo admins pueden actualizar perfiles
CREATE POLICY "Solo admins pueden actualizar perfiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: Solo admins pueden eliminar perfiles
CREATE POLICY "Solo admins pueden eliminar perfiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

---

## ✨ Funcionalidades implementadas

- ✅ Crear usuarios (admin/moderador)
- ✅ Editar información de usuarios
- ✅ Cambiar rol de usuarios
- ✅ Activar/Desactivar usuarios
- ✅ Eliminar usuarios
- ✅ Listado de usuarios con búsqueda
- ✅ Estadísticas de usuarios
- ✅ Validación de formularios

---

## 🧪 Cómo usar

1. Inicia sesión como **admin**
2. Ve a **Usuarios** en el menú
3. Haz clic en **Nuevo Usuario**
4. Completa el formulario:
   - Email
   - Contraseña (mínimo 6 caracteres)
   - Nombre completo
   - Rol (Moderador o Administrador)
5. Haz clic en **Crear Usuario**

El usuario se creará en:
- `auth.users` (autenticación de Supabase)
- `profiles` (información adicional)

---

## 🔒 Seguridad

### Para Desarrollo:
- Puedes usar la Service Role Key en el frontend
- Nunca la subas a Git (usa `.env.local` y agrega `.env.local` a `.gitignore`)

### Para Producción:
**DEBES** usar una de estas opciones:
1. **Edge Functions** de Supabase (Recomendado)
2. Backend con Node.js/Express
3. API Route de Next.js (si migras a Next.js)

Nunca expongas la Service Role Key en el frontend en producción.

---

## 🔧 Solución de problemas

### ❌ Error: "Failed to create user"
- Verifica que estés usando `supabaseAdmin` en lugar de `supabase`
- Comprueba que la Service Role Key sea correcta
- Revisa que el email no esté ya registrado

### ❌ Error: "relation profiles does not exist"
- Ejecuta el script SQL de creación de la tabla `profiles`
- Verifica en Database → Tables que la tabla exista

### ❌ No puedo crear usuarios
- Asegúrate de estar autenticado como admin
- Verifica las políticas RLS de la tabla `profiles`
- Revisa la consola del navegador por errores

---

## 📝 Notas importantes

- El email no se puede cambiar después de crear el usuario
- La contraseña se puede cambiar desde el perfil del usuario
- Los usuarios inactivos no pueden iniciar sesión
- Solo los admins pueden acceder a la página de Usuarios
- Al eliminar un usuario, también se eliminan sus datos relacionados (CASCADE)

---

¿Necesitas ayuda? Revisa la sección de **Solución de problemas** arriba.
