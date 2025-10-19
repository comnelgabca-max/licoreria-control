# Solucionar Error al Actualizar Precio del Dólar

## Paso 1: Verificar si la tabla existe

Ve a **SQL Editor** en Supabase y ejecuta:

```sql
-- Verificar si la tabla existe
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'configuraciones'
);
```

Si retorna **false**, ejecuta el Paso 2. Si retorna **true**, ve al Paso 3.

---

## Paso 2: Crear la tabla (si no existe)

```sql
-- Crear tabla de configuraciones
CREATE TABLE IF NOT EXISTS configuraciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave TEXT UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  descripcion TEXT,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_configuraciones_clave ON configuraciones(clave);

-- Habilitar RLS
ALTER TABLE configuraciones ENABLE ROW LEVEL SECURITY;

-- IMPORTANTE: Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "Todos pueden leer configuraciones" ON configuraciones;
DROP POLICY IF EXISTS "Solo admins pueden actualizar configuraciones" ON configuraciones;
DROP POLICY IF EXISTS "Solo admins pueden insertar configuraciones" ON configuraciones;

-- Política: Todos pueden leer
CREATE POLICY "Todos pueden leer configuraciones"
  ON configuraciones
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Solo admins pueden actualizar (CORREGIDA)
CREATE POLICY "Solo admins pueden actualizar configuraciones"
  ON configuraciones
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (true);

-- Política: Solo admins pueden insertar
CREATE POLICY "Solo admins pueden insertar configuraciones"
  ON configuraciones
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insertar precio del dólar inicial
INSERT INTO configuraciones (clave, valor, descripcion)
VALUES ('precio_dolar', '1.00', 'Precio del dólar del día')
ON CONFLICT (clave) DO NOTHING;
```

---

## Paso 3: Verificar que el registro existe

```sql
-- Ver el registro actual
SELECT * FROM configuraciones WHERE clave = 'precio_dolar';
```

Si no aparece nada, ejecuta:

```sql
-- Insertar precio del dólar
INSERT INTO configuraciones (clave, valor, descripcion)
VALUES ('precio_dolar', '45.00', 'Precio del dólar del día')
ON CONFLICT (clave) DO UPDATE SET valor = '45.00';
```

---

## Paso 4: Verificar tu rol de usuario

```sql
-- Ver tu usuario y rol actual
SELECT
  p.id,
  p.email,
  p.role,
  p.is_active
FROM profiles p
WHERE p.id = auth.uid();
```

Asegúrate de que `role = 'admin'`.

Si aparece como 'moderador', cámbialo:

```sql
-- Cambiar a admin (usa tu email)
UPDATE profiles
SET role = 'admin'
WHERE email = 'TU_EMAIL_AQUI@ejemplo.com';
```

---

## Paso 5: Verificar las políticas RLS

```sql
-- Ver todas las políticas de la tabla configuraciones
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
WHERE tablename = 'configuraciones';
```

---

## Paso 6: Probar actualización manual

```sql
-- Intentar actualizar manualmente
UPDATE configuraciones
SET valor = '50.00',
    updated_at = NOW()
WHERE clave = 'precio_dolar';
```

Si esto funciona, el problema es con las políticas RLS o con el código de la aplicación.

---

## Paso 7: Habilitar Realtime (Opcional)

1. Ve a **Database** → **Replication**
2. Busca `configuraciones`
3. Activa **Realtime**
4. Marca: INSERT, UPDATE, DELETE

---

## Script TODO EN UNO (Ejecuta esto si tienes dudas)

```sql
-- SCRIPT COMPLETO PARA ARREGLAR TODO

-- 1. Eliminar tabla si existe (CUIDADO: borra datos)
-- DROP TABLE IF EXISTS configuraciones CASCADE;

-- 2. Crear tabla
CREATE TABLE IF NOT EXISTS configuraciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave TEXT UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  descripcion TEXT,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear índice
CREATE INDEX IF NOT EXISTS idx_configuraciones_clave ON configuraciones(clave);

-- 4. Habilitar RLS
ALTER TABLE configuraciones ENABLE ROW LEVEL SECURITY;

-- 5. Eliminar políticas viejas
DROP POLICY IF EXISTS "Todos pueden leer configuraciones" ON configuraciones;
DROP POLICY IF EXISTS "Solo admins pueden actualizar configuraciones" ON configuraciones;
DROP POLICY IF EXISTS "Solo admins pueden insertar configuraciones" ON configuraciones;

-- 6. Crear políticas nuevas
CREATE POLICY "Todos pueden leer configuraciones"
  ON configuraciones
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Solo admins pueden actualizar configuraciones"
  ON configuraciones
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (true);

CREATE POLICY "Solo admins pueden insertar configuraciones"
  ON configuraciones
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 7. Insertar o actualizar precio del dólar
INSERT INTO configuraciones (clave, valor, descripcion)
VALUES ('precio_dolar', '45.00', 'Precio del dólar del día')
ON CONFLICT (clave) DO UPDATE SET valor = '45.00';

-- 8. Verificar todo
SELECT * FROM configuraciones;
SELECT id, email, role FROM profiles WHERE id = auth.uid();
```

---

Ejecuta este script y luego prueba de nuevo en la aplicación.
