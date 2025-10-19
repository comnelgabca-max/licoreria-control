# Verificar Políticas RLS de Profiles

## Problema
El timeout al obtener la sesión sugiere que las políticas RLS están bloqueando las consultas.

## Ejecuta este SQL en Supabase

```sql
-- 1. Ver las políticas actuales de profiles
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 2. Verificar que RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 3. Ver todos los perfiles
SELECT id, email, role, is_active FROM profiles;

-- 4. SOLUCIÓN: Crear política permisiva para SELECT
-- Eliminar política restrictiva si existe
DROP POLICY IF EXISTS "Usuarios pueden ver todos los perfiles" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Crear política que permita a TODOS los usuarios autenticados leer profiles
CREATE POLICY "Usuarios autenticados pueden leer profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- 5. Verificar que la política se creó
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'SELECT';
```

## Por qué esto soluciona el problema

Las políticas RLS demasiado restrictivas pueden bloquear la consulta cuando:
1. El usuario acaba de autenticarse y el token no está completamente propagado
2. La política requiere condiciones complejas que tardan en evaluar
3. Hay referencias circulares en las políticas

La nueva política permite a cualquier usuario autenticado leer la tabla `profiles`, lo cual es seguro porque:
- Solo usuarios con sesión válida pueden acceder
- Solo es para lectura (SELECT), no para modificar datos
- Necesitamos el rol del usuario para funcionalidad básica de la app
