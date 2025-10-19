# Configuración de Supabase

## Paso 1: Crear proyecto en Supabase

1. Ve a [Supabase](https://supabase.com/)
2. Haz clic en "Start your project"
3. Inicia sesión con GitHub (recomendado) o crea una cuenta
4. Haz clic en "New Project"
5. Completa los datos:
   - **Name**: licoreria-control
   - **Database Password**: Genera una contraseña segura (guárdala)
   - **Region**: Elige la más cercana (ej: South America - São Paulo)
   - **Pricing Plan**: Free (0$/mes - Perfecto para empezar)
6. Haz clic en "Create new project"
7. Espera 1-2 minutos mientras se crea el proyecto

## Paso 2: Obtener credenciales del proyecto

1. En el panel de Supabase, ve a **Settings** (configuración) en el menú lateral
2. Ve a **API**
3. Encontrarás dos valores importantes:
   - **Project URL**: (algo como https://xxxxx.supabase.co)
   - **anon/public key**: (una clave larga que empieza con "eyJ...")

## Paso 3: Configurar variables de entorno

1. Crea un archivo `.env` en la raíz del proyecto:

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

2. Reemplaza los valores con los que copiaste en el paso anterior

**IMPORTANTE**: El archivo `.env` ya está en `.gitignore` para no subir tus credenciales a GitHub

## Paso 4: Configurar Authentication

1. En el menú lateral de Supabase, ve a **Authentication** > **Providers**
2. Asegúrate de que **Email** esté habilitado
3. Desactiva "Confirm email" si quieres pruebas rápidas (puedes activarlo después)
4. Guarda los cambios

## Paso 5: Crear tablas en la base de datos

1. Ve a **SQL Editor** en el menú lateral
2. Haz clic en **+ New query**
3. Copia y pega este SQL:

```sql
-- Habilitar extensión UUID
create extension if not exists "uuid-ossp";

-- Tabla de usuarios
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text not null,
  role text not null check (role in ('admin', 'moderador')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (Row Level Security)
alter table public.users enable row level security;

-- Políticas de seguridad para users
create policy "Los usuarios pueden ver su propia información"
  on public.users for select
  using ( auth.uid() = id );

create policy "Solo admins pueden insertar usuarios"
  on public.users for insert
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Solo admins pueden actualizar usuarios"
  on public.users for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Tabla de clientes
create table public.clientes (
  id uuid default uuid_generate_v4() primary key,
  nombre text not null,
  telefono text,
  direccion text,
  saldo_total decimal(10,2) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users not null
);

alter table public.clientes enable row level security;

create policy "Usuarios autenticados pueden ver clientes"
  on public.clientes for select
  using ( auth.role() = 'authenticated' );

create policy "Usuarios autenticados pueden crear clientes"
  on public.clientes for insert
  with check ( auth.role() = 'authenticated' );

create policy "Usuarios autenticados pueden actualizar clientes"
  on public.clientes for update
  using ( auth.role() = 'authenticated' );

create policy "Solo admins pueden eliminar clientes"
  on public.clientes for delete
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Tabla de transacciones
create table public.transacciones (
  id uuid default uuid_generate_v4() primary key,
  cliente_id uuid references public.clientes on delete cascade not null,
  tipo text not null check (tipo in ('venta', 'pago')),
  monto decimal(10,2) not null,
  descripcion text,
  fecha timestamp with time zone default timezone('utc'::text, now()) not null,
  registrado_por uuid references auth.users not null
);

alter table public.transacciones enable row level security;

create policy "Usuarios autenticados pueden ver transacciones"
  on public.transacciones for select
  using ( auth.role() = 'authenticated' );

create policy "Usuarios autenticados pueden crear transacciones"
  on public.transacciones for insert
  with check ( auth.role() = 'authenticated' );

create policy "Solo admins pueden eliminar transacciones"
  on public.transacciones for delete
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Función para actualizar saldo del cliente automáticamente
create or replace function update_cliente_saldo()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.tipo = 'venta' then
      update public.clientes
      set saldo_total = saldo_total + NEW.monto
      where id = NEW.cliente_id;
    elsif NEW.tipo = 'pago' then
      update public.clientes
      set saldo_total = saldo_total - NEW.monto
      where id = NEW.cliente_id;
    end if;
  elsif TG_OP = 'DELETE' then
    if OLD.tipo = 'venta' then
      update public.clientes
      set saldo_total = saldo_total - OLD.monto
      where id = OLD.cliente_id;
    elsif OLD.tipo = 'pago' then
      update public.clientes
      set saldo_total = saldo_total + OLD.monto
      where id = OLD.cliente_id;
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

-- Trigger para actualizar saldo automáticamente
create trigger on_transaccion_change
  after insert or delete on public.transacciones
  for each row execute function update_cliente_saldo();
```

4. Haz clic en **Run** (o presiona Ctrl+Enter)
5. Deberías ver "Success. No rows returned"

## Paso 6: Crear el primer usuario (Admin)

1. Ve a **Authentication** > **Users**
2. Haz clic en **Add user** > **Create new user**
3. Completa:
   - **Email**: admin@licoreria.com (o el que prefieras)
   - **Password**: (elige una segura, mínimo 6 caracteres)
   - **Auto Confirm User**: Activado
4. Haz clic en **Create user**
5. **IMPORTANTE**: Copia el **User UID** que aparece (lo necesitarás en el siguiente paso)

## Paso 7: Agregar datos del admin a la tabla users

1. Ve a **SQL Editor** nuevamente
2. Crea una nueva query y pega esto (reemplaza el UUID con el que copiaste):

```sql
insert into public.users (id, email, name, role)
values (
  'PEGA_AQUI_EL_USER_UID',
  'admin@licoreria.com',
  'Administrador',
  'admin'
);
```

3. Ejecuta la query

## Paso 8: Probar la aplicación

1. Ejecuta tu proyecto:
```bash
npm run dev
```

2. Abre http://localhost:5173
3. Inicia sesión con las credenciales del admin
4. ¡Listo! Ya estás usando Supabase

## Diferencias clave vs Firebase

### Ventajas de Supabase:
- ✅ **Base de datos PostgreSQL** (más potente que Firestore)
- ✅ **SQL real** (relaciones, joins, triggers)
- ✅ **Plan gratuito más generoso**:
  - 500 MB de base de datos
  - 50,000 usuarios activos/mes
  - 2 GB de bandwidth
  - APIs ilimitadas
- ✅ **Row Level Security (RLS)** - Seguridad a nivel de fila
- ✅ **Triggers y funciones** - Lógica del lado del servidor
- ✅ **Open source** - Puedes auto-hospedarlo
- ✅ **Realtime** - Actualizaciones en tiempo real (como Firestore)

### Estructura de datos:

**En Firebase (NoSQL - Colecciones):**
```
users/
  - userId/
    - email
    - name
    - role
```

**En Supabase (SQL - Tablas):**
```sql
users (tabla)
  - id (UUID)
  - email (text)
  - name (text)
  - role (text)
```

## Funcionalidades automáticas implementadas

1. **Actualización automática de saldo**: Cuando registras una venta o pago, el saldo del cliente se actualiza automáticamente gracias al trigger `update_cliente_saldo()`

2. **Seguridad RLS**: Las políticas de seguridad aseguran que:
   - Solo usuarios autenticados pueden acceder a datos
   - Solo admins pueden eliminar clientes y transacciones
   - Cada usuario solo puede ver sus propios datos en la tabla users

3. **UUIDs automáticos**: Todas las tablas usan UUIDs en lugar de IDs numéricos para mayor seguridad

## Recursos útiles

- [Documentación oficial de Supabase](https://supabase.com/docs)
- [Dashboard de tu proyecto](https://app.supabase.com/)
- [Supabase Studio](https://app.supabase.com/) - Para gestionar datos visualmente
- [API Reference](https://supabase.com/docs/reference/javascript/introduction)

## Próximos pasos

1. Implementar CRUD de clientes
2. Implementar sistema de transacciones (ventas/pagos)
3. Crear dashboard con métricas en tiempo real
4. Añadir gestión de usuarios para admins
5. Implementar reportes y exportación de datos
