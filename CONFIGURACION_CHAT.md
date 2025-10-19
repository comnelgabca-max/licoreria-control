# Configuración del Chat - Guía Rápida

Sigue estos pasos para configurar el chat en tu aplicación.

---

## 📋 Paso 1: Crear la tabla en Supabase

1. Entra a tu proyecto en [Supabase](https://supabase.com)
2. Ve a **SQL Editor** (icono de rayos en el menú lateral)
3. Haz clic en **+ New query**
4. Copia y pega este código:

```sql
-- Crear tabla de mensajes de chat
CREATE TABLE mensajes_chat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mensaje TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_mensajes_chat_user_id ON mensajes_chat(user_id);
CREATE INDEX idx_mensajes_chat_created_at ON mensajes_chat(created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE mensajes_chat ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer mensajes
CREATE POLICY "Todos pueden leer mensajes"
  ON mensajes_chat
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Usuarios pueden crear mensajes
CREATE POLICY "Usuarios pueden crear mensajes"
  ON mensajes_chat
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuarios pueden eliminar sus mensajes O admins pueden eliminar cualquier mensaje
CREATE POLICY "Eliminar mensajes"
  ON mensajes_chat
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

5. Haz clic en **Run** (o presiona Ctrl + Enter)
6. Deberías ver: ✅ "Success. No rows returned"

---

## ⚡ Paso 2: Habilitar Realtime (Mensajes en tiempo real)

1. Ve a **Database** → **Replication** en el menú lateral
2. Busca la tabla `mensajes_chat` en la lista
3. Activa el switch de **Realtime**
4. Asegúrate de que estén marcadas las opciones:
   - ✅ INSERT
   - ✅ UPDATE
   - ✅ DELETE

---

## 🚀 Paso 3: Iniciar la aplicación

```bash
npm run dev
```

---

## 🧪 Paso 4: Probar el chat

1. Abre tu aplicación en el navegador
2. Inicia sesión con tu usuario
3. Ve a **Chat** en el menú lateral
4. Envía un mensaje de prueba
5. Abre la aplicación en otra pestaña/ventana
6. Los mensajes deberían aparecer en tiempo real ⚡

---

## 🔧 Solución de problemas

### ❌ Error: "relation mensajes_chat does not exist"
- Asegúrate de haber ejecutado el script SQL del Paso 1
- Verifica que la tabla aparezca en Database → Tables

### ❌ Los mensajes no aparecen en tiempo real
- Verifica que Realtime esté habilitado (Paso 2)
- Revisa la consola del navegador (F12) por errores
- Verifica que las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY estén configuradas

### ❌ No puedo enviar mensajes
- Verifica que estés autenticado
- Revisa las políticas RLS en Database → Policies
- Comprueba la consola del navegador por errores

### ❌ Error con la tabla "profiles"
- Asegúrate de que exista la tabla `profiles` con el campo `role`
- Si no existe, la última política (admins) no funcionará pero el resto sí

---

## ✨ Características del chat

- ✅ Mensajes en tiempo real (WebSockets)
- ✅ Identificación de usuarios
- ✅ Mensajes propios (azul) vs. otros usuarios (gris)
- ✅ Eliminar mensajes propios
- ✅ Admins pueden eliminar cualquier mensaje
- ✅ Scroll automático a nuevos mensajes
- ✅ Estadísticas (total mensajes, mensajes del día)
- ✅ Interfaz responsive

---

## 📊 Estructura de la tabla

| Campo       | Tipo                      | Descripción                    |
|-------------|---------------------------|--------------------------------|
| id          | UUID                      | Identificador único            |
| mensaje     | TEXT                      | Contenido del mensaje          |
| user_id     | UUID                      | ID del usuario (FK auth.users) |
| created_at  | TIMESTAMP WITH TIME ZONE  | Fecha de creación              |
| updated_at  | TIMESTAMP WITH TIME ZONE  | Fecha de actualización         |

---

## 💡 Notas importantes

- Los mensajes se ordenan de más antiguo a más reciente
- El chat hace scroll automático al recibir nuevos mensajes
- Los usuarios solo pueden eliminar sus propios mensajes
- Los admins pueden eliminar cualquier mensaje
- El sistema usa la tabla `profiles` para obtener info del usuario

---

¿Necesitas ayuda? Revisa la sección de **Solución de problemas** arriba.
