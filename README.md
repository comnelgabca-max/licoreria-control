# Control de Licorería - PWA

Sistema de control de deudores para licorería con Progressive Web App (PWA).

## Características

- 🔐 **Autenticación con Supabase**
- 👥 **Gestión de clientes**
- 💰 **Control de deudas (ventas y pagos)**
- 📊 **Dashboard con métricas**
- 👨‍💼 **Sistema de roles** (Admin y Moderador)
- 📱 **PWA** - Funciona offline e instala como app
- 🎨 **Tailwind CSS** - Diseño moderno y responsive
- 🚀 **PostgreSQL** - Base de datos robusta y escalable

## Stack Tecnológico

- **Frontend**: React 19 + Vite
- **Estilos**: Tailwind CSS v4
- **Backend**: Supabase (Auth + PostgreSQL)
- **Router**: React Router DOM v7
- **PWA**: vite-plugin-pwa

## Instalación

1. Clona el repositorio
2. Instala las dependencias:

```bash
npm install
```

3. Configura Supabase (ver SUPABASE_SETUP.md)

4. Crea un archivo `.env` con tus credenciales:

```bash
cp .env.example .env
# Edita .env con tus credenciales de Supabase
```

5. Ejecuta el proyecto:

```bash
npm run dev
```

## Estructura del Proyecto

```
src/
├── components/
│   ├── auth/          # Componentes de autenticación
│   ├── clientes/      # Componentes de clientes
│   ├── transacciones/ # Componentes de transacciones
│   ├── dashboard/     # Componentes del dashboard
│   ├── layout/        # Layout principal
│   └── common/        # Componentes reutilizables
├── pages/             # Páginas de la aplicación
├── context/           # Context API (AuthContext)
├── hooks/             # Custom hooks
├── services/          # Servicios (Supabase)
└── utils/             # Utilidades
```

## Configuración Inicial

**IMPORTANTE**: Antes de usar la aplicación, debes configurar Supabase.

Lee el archivo `SUPABASE_SETUP.md` para instrucciones detalladas paso a paso.

## Roles de Usuario

- **Admin**: Control total del sistema
  - CRUD de clientes
  - Registrar ventas/pagos
  - Gestionar usuarios
  - Ver reportes

- **Moderador**: Solo operaciones básicas
  - Registrar ventas
  - Registrar pagos
  - Ver clientes

## Estado del Desarrollo

### ✅ Fase 1 Completada
- [x] Proyecto configurado
- [x] Supabase integrado (migrado de Firebase)
- [x] Autenticación con PostgreSQL
- [x] PWA configurado
- [x] Layout y navegación
- [x] Páginas básicas

### 🚧 Próximas Fases
- [ ] Fase 2: CRUD de clientes
- [ ] Fase 3: Sistema de transacciones
- [ ] Fase 4: Dashboard con datos reales
- [ ] Fase 5: Gestión de usuarios
- [ ] Fase 6: Reportes y exportación

## Scripts Disponibles

```bash
npm run dev      # Modo desarrollo
npm run build    # Build para producción
npm run preview  # Preview del build
npm run lint     # Ejecutar ESLint
```

## Deploy

### Opción 1: Netlify (Recomendado) ⭐
```bash
# Build local
npm run build

# Deploy manual: arrastra la carpeta dist/ a https://app.netlify.com/drop
# O conecta con GitHub para deploy automático
```

Ver `DEPLOY_NETLIFY.md` para guía completa paso a paso.

### Opción 2: Vercel
```bash
npm run build
# Conecta tu repositorio a Vercel
```

### Opción 3: GitHub Pages
```bash
npm run build
# Configura GitHub Actions para deploy automático
```

## 🌐 Demo en Vivo

La aplicación funciona en **modo DEMO** sin necesidad de backend:
- **Usuario**: demo@licoreria.com
- **Contraseña**: demo123

Cuando conectes Supabase, el login será real.

## Licencia

MIT
