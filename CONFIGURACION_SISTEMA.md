# Configuración del Sistema - Precio del Dólar

Guía para configurar el sistema de precio del dólar.

---

## Paso 1: Crear tabla de configuraciones

Ejecuta este SQL en **SQL Editor** de Supabase:

```sql
-- Crear tabla de configuraciones del sistema
CREATE TABLE IF NOT EXISTS configuraciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave TEXT UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  descripcion TEXT,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar precio del dólar inicial
INSERT INTO configuraciones (clave, valor, descripcion)
VALUES ('precio_dolar', '1.00', 'Precio del dólar del día')
ON CONFLICT (clave) DO NOTHING;

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_configuraciones_clave ON configuraciones(clave);

-- Habilitar RLS
ALTER TABLE configuraciones ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer
CREATE POLICY "Todos pueden leer configuraciones"
  ON configuraciones
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Solo admins pueden actualizar
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
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

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
```

---

## ✅ Listo

Ahora la tabla está creada y lista para usar.
