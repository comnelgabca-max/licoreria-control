# 🚀 DEPLOY A NETLIFY - GUÍA RÁPIDA
## ✅ Ya tienes el repo en GitHub, ahora vamos directo al deploy

---

## PASO 1: VERIFICAR QUE EL BUILD FUNCIONA

### En PowerShell:
```powershell
cd C:\Users\usuario\Desktop\ProgramaLicoreria\licoreria-control

# Si npm run build no funciona, prueba:
npx vite build
```

**SI SALE ERROR:** Anótalo y corrígelo antes de continuar.

**SI FUNCIONA:** Verás una carpeta `dist/` creada con tu app. ✅

---

## PASO 2: CREAR CUENTA EN NETLIFY

### 2.1 Ir a Netlify
1. Abre: https://app.netlify.com/signup
2. Click en **"Continue with GitHub"**
3. Autoriza a Netlify (botón verde)
4. Ya tienes cuenta ✅

---

## PASO 3: IMPORTAR TU PROYECTO

### 3.1 Conectar repositorio
1. En Netlify, click en **"Add new site"** (arriba a la derecha)
2. Selecciona **"Import an existing project"**
3. Click en **"Deploy with GitHub"**
4. Te pedirá permiso, click **"Authorize Netlify"**
5. Busca tu repositorio `licoreria-control` en la lista
6. Click en el repositorio

### 3.2 Configurar el build
**¡NO HAGAS DEPLOY TODAVÍA!**

Verás una pantalla con configuración. Verifica:

```
Branch to deploy: main (o master)
Build command: npm run build
Publish directory: dist
```

**¡Perfecto! Pero ahora viene lo importante:**

---

## PASO 4: CONFIGURAR VARIABLES DE ENTORNO
### ⚠️ ESTE ES EL PASO MÁS IMPORTANTE

Antes de hacer deploy, necesitas agregar tus credenciales de Supabase.

### 4.1 Obtener credenciales de Supabase

1. Abre: https://app.supabase.com
2. Selecciona tu proyecto de la licorería
3. En el menú izquierdo: **Settings** ⚙️ → **API**
4. Copia dos valores:

   **A) Project URL**
   ```
   Ejemplo: https://abcdefghijklm.supabase.co
   ```

   **B) anon public key**
   ```
   Ejemplo: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBh...
   (es MUY largo, cópialo completo)
   ```

### 4.2 Agregar en Netlify

En la pantalla de configuración de Netlify:

1. Busca la sección **"Environment variables"**
2. Click en **"Add environment variables"** o **"New variable"**
3. Agrega estas 2 variables:

   **Variable 1:**
   ```
   Key: VITE_SUPABASE_URL
   Value: [pega tu Project URL de Supabase]
   ```

   **Variable 2:**
   ```
   Key: VITE_SUPABASE_ANON_KEY
   Value: [pega tu anon key de Supabase]
   ```

4. **IMPORTANTE:** Las keys deben decir exactamente:
   - `VITE_SUPABASE_URL` (no `SUPABASE_URL`)
   - `VITE_SUPABASE_ANON_KEY` (no `SUPABASE_ANON_KEY`)

   El prefijo `VITE_` es obligatorio.

---

## PASO 5: ¡DEPLOY!

### 5.1 Hacer el deploy
1. Verifica todo una vez más:
   - ✅ Build command: `npm run build`
   - ✅ Publish directory: `dist`
   - ✅ Variables agregadas: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`

2. Click en **"Deploy [nombre-del-sitio]"**

### 5.2 Esperar
- Verás un log en tiempo real
- Tomará 2-5 minutos
- Verás: Installing dependencies → Building → Deploying

### 5.3 ¡Listo!
Cuando termine verás:
```
✅ Site is live
```

Te dará una URL tipo: `https://random-name-123456.netlify.app`

---

## PASO 6: CAMBIAR EL NOMBRE DEL SITIO

### 6.1 Personalizar URL
1. En Netlify, ve a **"Site configuration"** → **"Site details"**
2. Busca **"Site name"**
3. Click en **"Change site name"**
4. Elige un nombre: `licoreria-control` o `mi-licoreria`
5. Click **"Save"**

Ahora tu URL será: `https://licoreria-control.netlify.app` ✨

---

## PASO 7: PROBAR LA APP

### 7.1 En computadora
1. Abre la URL de Netlify en tu navegador
2. Prueba el login
3. Verifica que todo funcione

### 7.2 En celular (probar PWA)

**Android:**
1. Abre la URL en Chrome del celular
2. Verás un banner "Instalar app"
   - O en el menú: ⋮ → "Instalar app"
3. Click **"Instalar"**
4. ¡Ya tienes un ícono en tu home screen! 📱

**iPhone:**
1. Abre la URL en Safari
2. Click en botón **Compartir** 📤 (abajo en el medio)
3. Busca **"Añadir a pantalla de inicio"**
4. Click **"Agregar"**
5. ¡Ya tienes un ícono! 📱

---

## PASO 8: CONFIGURAR SUPABASE PARA LA URL DE NETLIFY

### ⚠️ IMPORTANTE (o puede fallar el login)

1. Ve a Supabase: https://app.supabase.com
2. Selecciona tu proyecto
3. **Settings** → **Authentication** → **URL Configuration**
4. Agrega estas URLs:

   **Site URL:**
   ```
   https://tu-sitio.netlify.app
   ```

   **Redirect URLs (agrega estas 3):**
   ```
   https://tu-sitio.netlify.app/*
   https://tu-sitio.netlify.app
   http://localhost:5173/*
   ```

5. Click **"Save"**

---

## ✅ CHECKLIST FINAL

Antes de compartir con usuarios:

- [ ] Build exitoso en Netlify
- [ ] Variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY configuradas
- [ ] App abre en el navegador
- [ ] Login funciona
- [ ] Se puede agregar/ver clientes y transacciones
- [ ] URLs configuradas en Supabase
- [ ] PWA se instala en celular (Android o iOS)
- [ ] Probado que funciona como app instalada

---

## 🔄 ACTUALIZACIONES FUTURAS

### Cuando hagas cambios en el código:

1. **En GitHub Desktop:**
   - Escribe un mensaje de commit (ej: "Agregué reporte de deudas")
   - Click **"Commit to main"**
   - Click **"Push origin"**

2. **Netlify auto-deploya:**
   - Ve a Netlify → Deploys
   - Verás "Building..."
   - En 2-3 minutos tu app estará actualizada
   - ¡No tienes que hacer nada más! 🎉

---

## 🆘 PROBLEMAS COMUNES

### ❌ Página en blanco
**Causa:** Variables de entorno mal configuradas

**Solución:**
1. Netlify → Site configuration → Environment variables
2. Verifica que estén:
   - `VITE_SUPABASE_URL` (con VITE_)
   - `VITE_SUPABASE_ANON_KEY` (con VITE_)
3. Si las editaste: Deploys → Trigger deploy → Clear cache and deploy

---

### ❌ Error "Failed to build"
**Solución:**
1. Ve a Netlify → Deploys → [último deploy] → Deploy log
2. Lee el error (usualmente al final)
3. Anota el error y corrígelo en tu código
4. Haz commit con GitHub Desktop
5. Push → Netlify redeploya automático

---

### ❌ Login no funciona
**Causa:** Falta configurar URLs en Supabase

**Solución:**
- Revisa el PASO 8 arriba
- Agrega las Redirect URLs en Supabase

---

### ❌ "npm run build" no funciona en local
**Solución:**
```powershell
# Eliminar node_modules
Remove-Item -Recurse -Force node_modules

# Reinstalar
npm install

# Intentar de nuevo
npm run build

# O usar npx:
npx vite build
```

---

## 📱 COMPARTIR CON USUARIOS

### Envíales este mensaje:

```
¡Hola! Ya puedes usar la app de control de licorería:

🔗 Link: https://tu-sitio.netlify.app

📱 Para instalarla como app:

ANDROID:
1. Abre el link en Chrome
2. Click en "Instalar app"
3. ¡Listo!

iPHONE:
1. Abre el link en Safari
2. Botón compartir → "Añadir a pantalla de inicio"
3. ¡Listo!

👤 Tu usuario: [el que le creaste]
🔑 Contraseña: [la que le diste]
```

---

## 🎉 ¡FELICIDADES!

Tu app ya está en producción y funcionando como una app móvil real.

**Ventajas:**
- ✅ Gratis (Netlify plan free)
- ✅ HTTPS automático
- ✅ Actualizaciones automáticas
- ✅ Funciona como app nativa
- ✅ No necesitas Google Play Store
- ✅ Funciona en Android y iPhone

---

## 📊 MONITOREAR TU APP

### En Netlify puedes ver:
- **Deploys:** Historial de versiones
- **Functions:** Si usas edge functions
- **Analytics:** Visitas (plan pago)
- **Logs:** Errores en tiempo real

### URL del panel:
```
https://app.netlify.com/sites/tu-sitio/overview
```

---

**¿Problemas?**
- Revisa los logs en: Netlify → Deploys → Deploy log
- Abre DevTools en el navegador (F12) → Console
