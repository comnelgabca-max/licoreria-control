# Arreglar Permisos de Clientes para Moderadores

Los moderadores no pueden editar ni eliminar clientes porque las políticas RLS están muy restrictivas.

---

## Script SQL para Arreglar

Ejecuta este código en **SQL Editor** de Supabase:

```sql
-- 1. Ver las políticas actuales (para referencia)
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'clientes';

-- 2. ELIMINAR políticas restrictivas antiguas
DROP POLICY IF EXISTS "Solo admins pueden actualizar clientes" ON clientes;
DROP POLICY IF EXISTS "Solo admins pueden eliminar clientes" ON clientes;
DROP POLICY IF EXISTS "Solo admins pueden insertar clientes" ON clientes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar clientes" ON clientes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar clientes" ON clientes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar clientes" ON clientes;

-- 3. CREAR nuevas políticas que permitan a admin Y moderador

-- Política: Todos los autenticados pueden LEER clientes
CREATE POLICY "Usuarios autenticados pueden ver clientes"
  ON clientes
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Admins y moderadores pueden CREAR clientes
CREATE POLICY "Admins y moderadores pueden crear clientes"
  ON clientes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- Política: Admins y moderadores pueden ACTUALIZAR clientes
CREATE POLICY "Admins y moderadores pueden actualizar clientes"
  ON clientes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- Política: Admins y moderadores pueden ELIMINAR clientes (soft delete)
CREATE POLICY "Admins y moderadores pueden eliminar clientes"
  ON clientes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- 4. Verificar que las políticas se crearon correctamente
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'clientes'
ORDER BY policyname;
```

---

## Verificación

Después de ejecutar el script:

1. Cierra sesión y vuelve a iniciar como **moderador**
2. Ve a **Clientes**
3. Intenta **Editar** un cliente
4. Intenta **Eliminar** un cliente
5. Ambas acciones deberían funcionar

---

## ¿Qué hace este script?

- **Elimina políticas antiguas** que solo permitían acceso a admins
- **Crea políticas nuevas** que permiten a `admin` Y `moderador`:
  - ✅ Ver todos los clientes
  - ✅ Crear nuevos clientes
  - ✅ Editar clientes existentes
  - ✅ Eliminar clientes (soft delete)

---

## Nota importante

El sistema usa **soft delete** (eliminación suave), lo que significa que:
- Los clientes NO se eliminan permanentemente
- Solo se marcan como `is_active = false`
- No aparecen en la lista pero siguen en la base de datos

---

Ejecuta este script y prueba de nuevo con un usuario moderador.
