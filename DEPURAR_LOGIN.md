# Depurar Problema de Login

## Problema
La aplicación se queda cargando después de ingresar las credenciales.

## Cambios Realizados

### 1. AuthContext.jsx
- Agregado timeout de 10 segundos para prevenir carga infinita
- Mejorado manejo de errores en `loadSession()`
- Agregado logging extensivo en `login()` y `onAuthStateChange()`
- Mejor manejo del listener de cambios de autenticación

### 2. Logging Mejorado
Ahora verás estos mensajes en la consola del navegador:

**Al cargar la página:**
- `🔄 Cargando sesión...`
- `📝 Sesión obtenida: [email o "No hay sesión"]`
- `✅ Finalizando carga...`
- `✅ Auth listener configurado`

**Al hacer login:**
- `🔐 Intentando login...`
- `✅ Autenticación exitosa: [email]`
- `👤 Rol del usuario: [admin o moderador]`
- `✅ Login completado exitosamente`
- `🔔 Auth state change: SIGNED_IN`
- `🔑 SIGNED_IN detectado, obteniendo rol...`
- `✅ Rol obtenido en auth change: [admin o moderador]`

## Instrucciones para Probar

### Paso 1: Abrir la consola del navegador
1. Abre la aplicación en el navegador
2. Presiona F12 para abrir DevTools
3. Ve a la pestaña "Console"

### Paso 2: Verificar carga inicial
Deberías ver:
```
🔄 Cargando sesión...
📝 Sesión obtenida: No hay sesión
❌ No hay usuario autenticado
✅ Finalizando carga...
✅ Auth listener configurado
```

### Paso 3: Intentar login
1. Ingresa las credenciales (ejemplo: jeyson@licoreria.com)
2. Observa la consola

**Flujo esperado:**
```
🔐 Intentando login...
✅ Autenticación exitosa: jeyson@licoreria.com
👤 Rol del usuario: moderador
✅ Login completado exitosamente
🔔 Auth state change: SIGNED_IN
🔑 SIGNED_IN detectado, obteniendo rol...
✅ Rol obtenido en auth change: moderador
```

### Paso 4: Verificar si hay errores
Si ves alguno de estos mensajes, hay un problema:
- `❌ Error cargando sesión:` - Error al cargar sesión inicial
- `❌ Error en login:` - Error al autenticar
- `⚠️ Error obteniendo perfil:` - Error al obtener rol del usuario
- `Timeout obteniendo sesión` - La llamada a Supabase tardó más de 10 segundos

## Posibles Problemas y Soluciones

### 1. Si el login se queda cargando infinitamente
**Causa:** La consulta a Supabase no está respondiendo
**Solución:**
- Verifica la conexión a internet
- Verifica que la URL y API key de Supabase sean correctas
- Revisa la pestaña "Network" en DevTools para ver si hay requests pendientes

### 2. Si aparece "Error obteniendo perfil"
**Causa:** No existe el perfil del usuario en la tabla `profiles`
**Solución:**
Ejecuta en Supabase SQL Editor:
```sql
-- Ver todos los perfiles
SELECT id, email, role FROM profiles;

-- Si falta un perfil, insertarlo
INSERT INTO profiles (id, email, role, full_name)
SELECT id, email, 'moderador', email
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.users.id
);
```

### 3. Si el rol aparece incorrecto
**Causa:** El rol en la tabla `profiles` no es el esperado
**Solución:**
```sql
-- Verificar rol del usuario
SELECT email, role FROM profiles WHERE email = 'jeyson@licoreria.com';

-- Actualizar si es necesario
UPDATE profiles
SET role = 'moderador'
WHERE email = 'jeyson@licoreria.com';
```

### 4. Si aparecen múltiples "Auth state change"
**Causa:** El listener se está disparando múltiples veces (esto es normal)
**Solución:** Ignorar si la aplicación funciona correctamente

## Próximos Pasos

Después de probar:
1. Copia los mensajes de la consola
2. Indica en qué punto se queda cargando
3. Revisa si hay algún error en rojo en la consola
4. Verifica la pestaña "Network" para ver requests pendientes

---

## Notas Técnicas

### Race Condition
Cuando se hace login, tanto `login()` como `onAuthStateChange` establecen el estado del usuario. Esto es intencional:
- `login()` establece el estado inmediatamente para una respuesta rápida
- `onAuthStateChange` actualiza el estado cuando Supabase confirma el cambio

Esto puede causar 2 actualizaciones de estado, pero React las maneja correctamente.

### Timeout de 10 segundos
Si `getSession()` tarda más de 10 segundos, se lanza un error y la app muestra la pantalla de login en lugar de quedarse cargando infinitamente.
