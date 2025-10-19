-- =====================================================
-- ARREGLAR POLÍTICAS RLS DE PROFILES - URGENTE
-- =====================================================
-- Este script soluciona el timeout al hacer login

-- 1. Ver las políticas actuales (para referencia)
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 2. ELIMINAR todas las políticas restrictivas
DROP POLICY IF EXISTS "Usuarios pueden ver todos los perfiles" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Solo admins pueden ver perfiles" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- 3. CREAR política permisiva para SELECT
-- Esta política permite a TODOS los usuarios autenticados leer profiles
CREATE POLICY "Usuarios autenticados pueden leer profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- 4. Mantener políticas restrictivas solo para UPDATE/INSERT/DELETE
-- (si existen, las dejamos como están)

-- 5. Verificar que la política se creó correctamente
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- 6. Verificar que los datos existen
SELECT id, email, role, is_active FROM profiles;

-- 7. Si falta algún perfil, crearlo
INSERT INTO profiles (id, email, role, full_name, is_active)
SELECT
  u.id,
  u.email,
  'moderador' as role,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) as full_name,
  true as is_active
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = u.id
);

-- 8. Verificar de nuevo
SELECT id, email, role, is_active FROM profiles;
