# Solo Administradores pueden Editar/Eliminar Clientes

Script para que SOLO los admins puedan editar y eliminar clientes.

---

## Script SQL

Ejecuta esto en **SQL Editor** de Supabase:

```sql
-- Eliminar políticas que permiten a moderadores
DROP POLICY IF EXISTS "Admins y moderadores pueden actualizar clientes" ON clientes;
DROP POLICY IF EXISTS "Admins y moderadores pueden eliminar clientes" ON clientes;
DROP POLICY IF EXISTS "Admins y moderadores pueden crear clientes" ON clientes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver clientes" ON clientes;

-- Crear políticas SOLO para admins

-- Ver clientes (todos pueden ver)
CREATE POLICY "Usuarios autenticados pueden ver clientes"
  ON clientes FOR SELECT TO authenticated
  USING (true);

-- Crear clientes (solo admins)
CREATE POLICY "Solo admins pueden crear clientes"
  ON clientes FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Editar clientes (solo admins)
CREATE POLICY "Solo admins pueden actualizar clientes"
  ON clientes FOR UPDATE TO authenticated
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
```

---

Ejecuta este script y los moderadores ya no podrán editar ni eliminar clientes.
