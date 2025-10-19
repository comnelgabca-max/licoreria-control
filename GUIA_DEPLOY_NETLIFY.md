# 🚀 GUÍA COMPLETA: DEPLOY A NETLIFY

## 📋 TABLA DE CONTENIDOS
1. [Preparar el Proyecto](#1-preparar-el-proyecto)
2. [Crear Repositorio en GitHub](#2-crear-repositorio-en-github)
3. [Deploy en Netlify](#3-deploy-en-netlify)
4. [Configurar Variables de Entorno](#4-configurar-variables-de-entorno)
5. [Verificar PWA](#5-verificar-pwa)
6. [Dominio Personalizado (Opcional)](#6-dominio-personalizado-opcional)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. PREPARAR EL PROYECTO

### 1.1 Verificar que el build funciona
```bash
cd /mnt/c/users/usuario/desktop/programalicoreria/licoreria-control
npm run build
```

Si hay errores, corrígelos antes de continuar.

### 1.2 Verificar archivos necesarios
✅ `netlify.toml` - Ya lo tienes configurado
✅ `.env.example` - Ya lo tienes
✅ `dist/` - Se creará con el build

### 1.3 Crear/verificar .gitignore
Asegúrate de que `.gitignore` incluya:
```
node_modules/
dist/
.env
.env.local
```

---

## 2. CREAR REPOSITORIO EN GITHUB

### 2.1 Inicializar Git (si no lo has hecho)
```bash
cd /mnt/c/users/usuario/desktop/programalicoreria/licoreria-control
git init
git add .
git commit -m "Initial commit - Licoreria Control App"
```

### 2.2 Crear repositorio en GitHub
1. Ve a https://github.com/new
2. Nombre del repo: `licoreria-control` (o el que prefieras)
3. Descripción: "Sistema de control de deudores para licorería"
4. **Private** (recomendado) o Public
5. NO marques "Add README" (ya tienes archivos)
6. Click en "Create repository"

### 2.3 Conectar y subir
GitHub te dará comandos, úsalos:
```bash
git remote add origin https://github.com/TU-USUARIO/licoreria-control.git
git branch -M main
git push -u origin main
```

**IMPORTANTE:** NO subas el archivo `.env` con tus claves reales. Solo `.env.example`.

---

## 3. DEPLOY EN NETLIFY

### Opción A: Deploy desde GitHub (RECOMENDADO)

#### 3.1 Crear cuenta en Netlify
1. Ve a https://app.netlify.com/signup
2. Regístrate con tu cuenta de GitHub (más fácil)
3. Autoriza a Netlify para acceder a tus repos

#### 3.2 Importar proyecto
1. Click en "Add new site" → "Import an existing project"
2. Selecciona "Deploy with GitHub"
3. Autoriza a Netlify (si lo pide)
4. Busca y selecciona tu repo `licoreria-control`

#### 3.3 Configurar el build
Netlify detectará automáticamente la configuración desde `netlify.toml`, pero verifica:

- **Build command:** `npm run build` ✅
- **Publish directory:** `dist` ✅
- **Branch to deploy:** `main` ✅

#### 3.4 NO hagas deploy aún
Click en "Show advanced" para configurar variables de entorno primero.

---

## 4. CONFIGURAR VARIABLES DE ENTORNO

### 4.1 Obtener credenciales de Supabase
1. Ve a https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a Settings → API
4. Copia:
   - **Project URL** (ej: https://abcdefgh.supabase.co)
   - **anon/public key** (comienza con `eyJ...`)

### 4.2 Agregar en Netlify
En la pantalla de configuración, sección "Environment variables", agrega:

| Key | Value | Ejemplo |
|-----|-------|---------|
| `VITE_SUPABASE_URL` | Tu Project URL | `https://abcdefgh.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Tu anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_APP_NAME` | Control de Licorería | Opcional |
| `VITE_APP_VERSION` | 1.0.0 | Opcional |
| `VITE_ENV` | production | Opcional |

**IMPORTANTE:** Las variables DEBEN empezar con `VITE_` para que Vite las reconozca.

### 4.3 Deploy
Ahora sí, click en "Deploy site"

⏳ Espera 2-5 minutos mientras Netlify:
- Instala dependencias
- Ejecuta el build
- Publica tu app

---

## 5. VERIFICAR PWA

### 5.1 Una vez deployado
1. Netlify te dará una URL tipo: `https://random-name-123456.netlify.app`
2. Copia esa URL

### 5.2 Cambiar nombre del sitio (opcional)
1. En Netlify: Site settings → General → Site details
2. Click "Change site name"
3. Elige algo como: `licoreria-control` o `mi-licoreria`
4. Tu URL será: `https://licoreria-control.netlify.app`

### 5.3 Probar en móvil

#### En Android (Chrome):
1. Abre la URL en Chrome
2. Verás un banner "Instalar app" o en el menú: ⋮ → "Instalar app"
3. Click en instalar
4. ¡Ahora tienes un ícono en tu home screen!

#### En iPhone (Safari):
1. Abre la URL en Safari
2. Click en el botón "Compartir" 📤
3. "Añadir a pantalla de inicio"
4. ¡Listo!

### 5.4 Verificar que funciona offline
1. Abre la app instalada
2. Activa modo avión
3. La app debería seguir funcionando (al menos la UI)

---

## 6. DOMINIO PERSONALIZADO (OPCIONAL)

Si tienes un dominio (ej: `www.milicoreria.com`):

### 6.1 En Netlify
1. Site settings → Domain management
2. Click "Add custom domain"
3. Ingresa tu dominio: `milicoreria.com`
4. Netlify te dará instrucciones DNS

### 6.2 En tu proveedor de dominio (GoDaddy, Namecheap, etc.)
Agrega estos DNS records:
```
Type: A
Name: @
Value: 75.2.60.5 (IP de Netlify)

Type: CNAME
Name: www
Value: tu-sitio.netlify.app
```

**NOTA:** Los cambios DNS tardan 24-48 horas.

---

## 7. TROUBLESHOOTING

### ❌ Error: "Build failed"
**Solución:**
```bash
# Verifica que el build funcione localmente
npm run build

# Si falla, revisa los errores y corrígelos
# Luego haz commit y push
git add .
git commit -m "Fix build errors"
git push
```

### ❌ Página en blanco después del deploy
**Causa:** Variables de entorno no configuradas

**Solución:**
1. Ve a Site settings → Environment variables
2. Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén correctas
3. En Deploys → Trigger deploy → Deploy site

### ❌ La app no funciona como PWA
**Checklist:**
- ✅ El sitio debe tener HTTPS (Netlify lo da automático)
- ✅ Verifica que `sw.js` esté en `/dist/` después del build
- ✅ Abre DevTools → Application → Manifest (debe aparecer)
- ✅ Prueba en modo incógnito (sin cache)

### ❌ Errores de CORS con Supabase
**Solución:**
1. Ve a Supabase → Settings → API
2. En "Site URL" agrega tu URL de Netlify: `https://tu-sitio.netlify.app`
3. En "Redirect URLs" agrega:
   - `https://tu-sitio.netlify.app/*`
   - `http://localhost:5173/*` (para desarrollo)

### ❌ 404 en rutas (ej: `/clientes`)
**Solución:** Ya está configurado en `netlify.toml` con:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Si persiste, verifica que el archivo `netlify.toml` esté en la raíz del proyecto.

---

## 📱 ACTUALIZACIONES FUTURAS

### Cada vez que hagas cambios:
```bash
# 1. Haz tus cambios
# 2. Prueba localmente
npm run dev

# 3. Verifica el build
npm run build

# 4. Commit y push
git add .
git commit -m "Descripción de los cambios"
git push

# ¡Netlify auto-deploya en 2-3 minutos! 🎉
```

### Ver deploys
1. En Netlify → Deploys
2. Verás el historial de todos tus deploys
3. Puedes hacer rollback a versiones anteriores

---

## 🎉 CHECKLIST FINAL

Antes de compartir tu app con usuarios:

- [ ] ✅ Build exitoso en Netlify
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ App funciona en navegador
- [ ] ✅ PWA se puede instalar en móvil
- [ ] ✅ Login/logout funciona
- [ ] ✅ Conexión a Supabase funciona
- [ ] ✅ Probado en Android y/o iOS
- [ ] ✅ Funciona offline (al menos UI básica)
- [ ] ✅ URL personalizada (opcional)

---

## 📞 COMPARTIR CON USUARIOS

Envíales:
1. **URL:** `https://tu-sitio.netlify.app`
2. **Instrucciones de instalación:**

   **Android:**
   - Abre el link en Chrome
   - Click en "Instalar app" o menú → Instalar

   **iPhone:**
   - Abre el link en Safari
   - Botón compartir → "Añadir a pantalla de inicio"

3. **Credenciales de prueba** (si aplica)

---

## 💡 TIPS PRO

### Deploy previews
Netlify crea un preview automático para cada Pull Request.

### Proteger con contraseña (gratis)
Site settings → Visitor access → Password protection

### Analytics (gratis)
Site settings → Analytics → Enable

### Formularios (gratis)
Netlify Forms permite recibir formularios sin backend.

---

## 🔗 RECURSOS

- Netlify Docs: https://docs.netlify.com
- Vite PWA: https://vite-pwa-org.netlify.app
- Supabase Docs: https://supabase.com/docs

---

**¿Problemas?** Revisa los logs en Netlify → Deploys → [último deploy] → Deploy log
