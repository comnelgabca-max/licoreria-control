# 🚀 Guía de Deploy a Netlify

## Opción 1: Deploy desde GitHub (Recomendado) ⭐

### Paso 1: Crear repositorio en GitHub

1. Ve a https://github.com y crea un nuevo repositorio
2. Nombra el repositorio: `licoreria-control`
3. NO inicialices con README (ya tienes archivos)

### Paso 2: Subir código a GitHub

Abre la terminal en tu proyecto y ejecuta:

```bash
# Inicializar git (si no está inicializado)
git init

# Agregar todos los archivos
git add .

# Crear primer commit
git commit -m "Initial commit - Control de Licorería"

# Conectar con GitHub (reemplaza TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/licoreria-control.git

# Subir a GitHub
git branch -M main
git push -u origin main
```

### Paso 3: Deploy en Netlify

1. Ve a https://app.netlify.com/
2. Crea una cuenta (gratis) o inicia sesión
3. Click en **"Add new site"** → **"Import an existing project"**
4. Conecta con **GitHub**
5. Autoriza a Netlify
6. Selecciona el repositorio **licoreria-control**
7. Configuración de build:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
8. Click en **"Deploy site"**

¡Listo! En 2-3 minutos tu app estará online.

---

## Opción 2: Deploy Manual (Más Rápido)

Si no quieres usar GitHub:

### Paso 1: Hacer el build

```bash
npm run build
```

Esto crea la carpeta `dist/` con tu aplicación lista para producción.

### Paso 2: Deploy manual en Netlify

1. Ve a https://app.netlify.com/drop
2. Arrastra la carpeta `dist/` directamente al navegador
3. ¡Listo! Tu app estará online en segundos

---

## Opción 3: CLI de Netlify (Para desarrolladores)

### Instalar Netlify CLI

```bash
npm install -g netlify-cli
```

### Deploy

```bash
# Login
netlify login

# Deploy
netlify deploy --prod
```

---

## 🔐 Credenciales DEMO

Una vez desplegado, usa estas credenciales para probar:

- **Email**: demo@licoreria.com
- **Password**: demo123

---

## 📱 Instalar como PWA

Una vez desplegado en Netlify:

### En iPhone:
1. Abre la URL en Safari
2. Toca el botón compartir
3. "Agregar a pantalla de inicio"

### En Android:
1. Abre la URL en Chrome
2. Toca los 3 puntos
3. "Instalar aplicación"

---

## 🎯 Configuración Post-Deploy

### Nombre de dominio personalizado (opcional)

En Netlify Dashboard:
1. **Site settings** → **Domain management**
2. **Add custom domain**
3. Sigue las instrucciones

### Variables de entorno (para cuando uses Supabase)

En Netlify Dashboard:
1. **Site settings** → **Environment variables**
2. Agregar:
   - `VITE_SUPABASE_URL` = tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` = tu clave pública

---

## 🔄 Deploy Automático

Si conectaste con GitHub, cada vez que hagas `git push`:
1. Netlify detecta los cambios
2. Ejecuta automáticamente `npm run build`
3. Despliega la nueva versión
4. ¡Sin hacer nada más!

---

## ✅ Checklist Pre-Deploy

- [x] Código en modo DEMO (funciona sin Supabase)
- [x] Build exitoso (`npm run build`)
- [x] PWA configurado
- [x] `netlify.toml` configurado
- [x] Redirects para SPA configurados
- [ ] GitHub repo creado (si usas Opción 1)

---

## 🆘 Solución de Problemas

### Error: "Build failed"

Verifica que en tu `package.json` tengas:
```json
"scripts": {
  "build": "vite build"
}
```

### Error: "Page not found" al recargar

Asegúrate de tener el archivo `netlify.toml` con los redirects.

### Error: "Blank page"

Abre la consola del navegador (F12) y revisa errores.

---

## 📊 Lo que obtienes gratis con Netlify

- ✅ HTTPS automático
- ✅ CDN global
- ✅ Deploy automático desde GitHub
- ✅ Preview deploys (para cada pull request)
- ✅ Rollback instantáneo
- ✅ Dominio personalizado
- ✅ 100 GB bandwidth/mes gratis

---

## 🚀 Siguiente Nivel

Cuando quieras conectar Supabase:

1. Configura Supabase (ver `SUPABASE_SETUP.md`)
2. Agrega variables de entorno en Netlify
3. Descomenta la importación de Supabase en `AuthContext.jsx`
4. Haz `git push`
5. ¡Netlify redespliega automáticamente!

---

**¡Listo para deployar!** 🎉

Elige una de las 3 opciones y en minutos tendrás tu app online accesible desde cualquier dispositivo.
