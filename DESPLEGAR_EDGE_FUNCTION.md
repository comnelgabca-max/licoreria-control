# Desplegar Edge Function para Crear Usuarios

## ¿Por qué necesitas esto?

Para crear usuarios de forma segura, necesitas usar una **Edge Function** de Supabase que:
- Se ejecuta en el servidor (no en el navegador)
- Tiene permisos de administrador
- Puede crear usuarios en `auth.users` y `profiles` de forma atómica

## Opción 1: Desplegar mediante Supabase CLI (Recomendado)

### Paso 1: Verificar que Supabase CLI esté instalado

```bash
supabase --version
```

Si no está instalado, instálalo:

**Windows (PowerShell):**
```powershell
scoop install supabase
```

**O descarga el binario:**
https://github.com/supabase/cli/releases

### Paso 2: Enlazar tu proyecto (si no lo has hecho)

```bash
cd /mnt/c/users/usuario/desktop/programalicoreria/licoreria-control
supabase link --project-ref [TU_PROJECT_REF]
```

Para obtener tu `PROJECT_REF`:
1. Ve a https://app.supabase.com
2. Abre tu proyecto
3. Copia el ID del proyecto desde la URL: `https://app.supabase.com/project/[ESTE_ES_TU_REF]`

### Paso 3: Desplegar la Edge Function

```bash
cd /mnt/c/users/usuario/desktop/programalicoreria/licoreria-control
supabase functions deploy create-user
```

### Paso 4: Verificar que se desplegó

```bash
supabase functions list
```

Deberías ver `create-user` en la lista.

---

## Opción 2: Desplegar manualmente desde el Dashboard

Si no quieres usar la CLI, puedes crear la función manualmente:

### Paso 1: Ir al Dashboard de Supabase

1. Ve a https://app.supabase.com
2. Abre tu proyecto
3. Ve a **Edge Functions** en el menú lateral

### Paso 2: Crear nueva función

1. Haz clic en **Create a new function**
2. Nombre: `create-user`
3. Copia y pega el código de:
   ```
   supabase/functions/create-user/index.ts
   ```

### Paso 3: Desplegar

1. Haz clic en **Deploy**
2. Espera a que se despliegue (puede tardar 1-2 minutos)

---

## Verificar que Funciona

### Opción A: Probar desde la aplicación

1. Ve a la sección **Usuarios**
2. Haz clic en **Nuevo Usuario**
3. Llena el formulario:
   - Email: `nuevo@ejemplo.com`
   - Contraseña: `123456`
   - Nombre: `Usuario de Prueba`
   - Rol: `Moderador`
4. Haz clic en **Crear Usuario**

Si todo funciona, verás el nuevo usuario en la lista.

### Opción B: Probar desde el Dashboard de Supabase

1. Ve a **Edge Functions** → `create-user`
2. Haz clic en **Invoke Function**
3. Pega este JSON:

```json
{
  "email": "test@ejemplo.com",
  "password": "123456",
  "fullName": "Usuario Test",
  "role": "moderador"
}
```

4. Agrega el header de autorización (usa tu token de admin)
5. Haz clic en **Invoke**

---

## Solución de Problemas

### Error: "Not authorized"

**Causa:** No tienes permisos de admin o el token es inválido.

**Solución:**
```sql
-- Verificar tu rol en Supabase SQL Editor
SELECT email, role FROM profiles WHERE email = 'TU_EMAIL@ejemplo.com';

-- Si no eres admin, actualiza:
UPDATE profiles SET role = 'admin' WHERE email = 'TU_EMAIL@ejemplo.com';
```

### Error: "Function not found"

**Causa:** La Edge Function no está desplegada.

**Solución:** Sigue los pasos de despliegue nuevamente.

### Error: "SUPABASE_SERVICE_ROLE_KEY is not defined"

**Causa:** La Edge Function no tiene acceso a las variables de entorno.

**Solución:** Las Edge Functions desplegadas en Supabase automáticamente tienen acceso a estas variables. Asegúrate de desplegar correctamente.

---

## Alternativa: Crear Usuarios Manualmente (Sin Edge Function)

Si no quieres usar Edge Functions, puedes crear usuarios manualmente:

### Paso 1: Crear usuario en Authentication

1. Ve a **Authentication** → **Users**
2. Haz clic en **Add user**
3. Ingresa email y contraseña
4. Marca **Auto Confirm User**
5. Haz clic en **Create User**

### Paso 2: Crear perfil en SQL Editor

```sql
-- Reemplaza los valores
INSERT INTO profiles (id, email, full_name, role, is_active)
VALUES (
  '[PEGA_EL_UUID_DEL_USUARIO_CREADO]',
  'nuevo@ejemplo.com',
  'Nombre del Usuario',
  'moderador',
  true
);
```

Para obtener el UUID:
1. Ve a **Authentication** → **Users**
2. Encuentra el usuario que creaste
3. Copia su UUID

---

## ¿Qué Sucede Cuando Creas un Usuario?

1. **La Edge Function verifica**:
   - Que seas admin
   - Que todos los campos estén presentes
   - Que la contraseña tenga al menos 6 caracteres

2. **Crea el usuario en `auth.users`**:
   - Email y contraseña
   - Auto-confirma el email
   - Guarda el nombre en metadata

3. **Crea el perfil en `profiles`**:
   - ID (mismo que auth.users)
   - Email, nombre completo, rol
   - Estado activo por defecto

4. **Si algo falla**:
   - Elimina el usuario de auth
   - Retorna error detallado

Todo esto sucede de forma atómica y segura.

---

## Próximos Pasos

1. Despliega la Edge Function usando la Opción 1 o 2
2. Verifica que funciona desde la aplicación
3. ¡Ya puedes crear usuarios moderadores sin problemas!

Si tienes algún error, revisa la consola del navegador y los logs de la Edge Function en el Dashboard de Supabase.
