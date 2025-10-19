# Guía Completa: Crear Usuarios con Edge Functions (Opción Recomendada)

Esta es la forma MÁS SEGURA de crear usuarios desde tu aplicación, ya que la Service Role Key nunca se expone al cliente.

---

## 📋 Requisitos previos

- Proyecto en Supabase activo
- Tener instalado [Supabase CLI](https://supabase.com/docs/guides/cli)
- Node.js instalado

---

## Paso 1: Instalar Supabase CLI

### En Windows (con npm):
```bash
npm install -g supabase
```

### Verificar instalación:
```bash
supabase --version
```

---

## Paso 2: Inicializar Supabase en tu proyecto

Abre tu terminal en la carpeta del proyecto:

```bash
cd /mnt/c/users/usuario/desktop/programalicoreria/licoreria-control
```

Inicializa Supabase:
```bash
supabase init
```

Esto creará una carpeta `supabase/` en tu proyecto.

---

## Paso 3: Hacer login en Supabase CLI

```bash
supabase login
```

Se abrirá tu navegador para autenticarte. Acepta los permisos.

---

## Paso 4: Vincular tu proyecto

1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Ve a **Settings** → **General**
3. Copia el **Reference ID** (algo como `abcdefghijklmnop`)

Vincula el proyecto:
```bash
supabase link --project-ref TU_REFERENCE_ID
```

Te pedirá tu contraseña de la base de datos.

---

## Paso 5: Crear la Edge Function

```bash
supabase functions new create-user
```

Esto creará el archivo: `supabase/functions/create-user/index.ts`

---

## Paso 6: Escribir el código de la Edge Function

Abre `supabase/functions/create-user/index.ts` y reemplaza todo con este código:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejar CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Crear cliente de Supabase con Service Role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar que el usuario que hace la petición es admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verificar que el usuario es admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Solo los administradores pueden crear usuarios' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Obtener datos del body
    const { email, password, fullName, role } = await req.json()

    // Validar datos
    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: 'Email, contraseña y nombre completo son requeridos' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Crear usuario en auth.users
    const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    })

    if (authCreateError) {
      return new Response(
        JSON.stringify({ error: authCreateError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Crear perfil en profiles
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: authData.user.id,
        email: email,
        role: role || 'moderador',
        full_name: fullName,
        is_active: true
      }])
      .select()
      .single()

    if (profileError) {
      // Si falla la creación del perfil, eliminar el usuario de auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)

      return new Response(
        JSON.stringify({ error: 'Error al crear perfil: ' + profileError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: profileData
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
```

---

## Paso 7: Desplegar la Edge Function

```bash
supabase functions deploy create-user
```

Deberías ver un mensaje como: `✓ Deployed Function create-user`

---

## Paso 8: Verificar el deployment

Ve a tu proyecto en Supabase → **Edge Functions**

Deberías ver tu función `create-user` listada.

---

## Paso 9: Actualizar el servicio en tu aplicación

Modifica `src/services/usuariosService.js`:

Encuentra la función `createUsuario` y reemplázala con:

```javascript
export const createUsuario = async (userData) => {
  try {
    // Obtener el token del usuario actual
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('No hay sesión activa');
    }

    // Llamar a la Edge Function
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
        email: userData.email,
        password: userData.password,
        fullName: userData.fullName,
        role: userData.role || 'moderador'
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      throw error;
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return { success: false, error: error.message };
  }
};
```

---

## Paso 10: Crear la tabla profiles (si no existe)

Ve a Supabase → **SQL Editor** y ejecuta:

```sql
-- Crear tabla profiles
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Usuarios autenticados pueden ver perfiles"
  ON profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Solo admins pueden insertar perfiles"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Solo admins pueden actualizar perfiles"
  ON profiles FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Solo admins pueden eliminar perfiles"
  ON profiles FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

---

## Paso 11: Probar la funcionalidad

1. Inicia tu aplicación:
```bash
npm run dev
```

2. Inicia sesión como administrador

3. Ve a **Usuarios** en el menú

4. Haz clic en **Nuevo Usuario**

5. Completa el formulario:
   - Email: `moderador@ejemplo.com`
   - Contraseña: `123456`
   - Nombre: `Juan Pérez`
   - Rol: `Moderador`

6. Haz clic en **Crear Usuario**

7. Si todo funciona, verás el nuevo usuario en la tabla

---

## 🔧 Solución de problemas

### ❌ Error: "Function create-user not found"
- Verifica que la función esté desplegada: `supabase functions list`
- Intenta desplegarla de nuevo: `supabase functions deploy create-user`

### ❌ Error: "No autorizado"
- Asegúrate de estar autenticado como admin
- Verifica que tu usuario tenga `role = 'admin'` en la tabla `profiles`

### ❌ Error: "relation profiles does not exist"
- Ejecuta el script SQL del Paso 10 para crear la tabla

### ❌ La función se despliega pero da error al ejecutar
- Ve a Supabase → **Edge Functions** → **create-user** → **Logs**
- Revisa los logs para ver el error específico

### ❌ Error de CORS
- Asegúrate de que el código incluya los `corsHeaders`
- Verifica que la función maneje `OPTIONS` request

---

## 📊 Logs y Debugging

Para ver los logs de tu función:

```bash
supabase functions serve create-user --no-verify-jwt
```

O en el dashboard de Supabase:
1. Ve a **Edge Functions**
2. Haz clic en `create-user`
3. Ve a la pestaña **Logs**

---

## 🔒 Seguridad

Esta implementación es segura porque:

- ✅ La Service Role Key nunca se expone al cliente
- ✅ Se verifica que el usuario sea admin antes de crear usuarios
- ✅ Se usa el token del usuario autenticado
- ✅ Las validaciones se hacen en el servidor
- ✅ Las políticas RLS protegen la base de datos

---

## 🎯 Siguiente paso

Una vez que funcione, puedes implementar más Edge Functions para:
- Actualizar usuarios
- Eliminar usuarios
- Cambiar contraseñas
- Enviar emails de bienvenida

---

¿Necesitas ayuda con algún paso? Revisa la sección de **Solución de problemas**.
