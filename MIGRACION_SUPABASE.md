# Migración de Firebase a Supabase - Completada ✅

Este documento resume la migración exitosa de Firebase a Supabase en el proyecto.

## Cambios Realizados

### 1. Dependencias

**Antes (Firebase):**
```json
"dependencies": {
  "firebase": "^12.3.0"
}
```

**Ahora (Supabase):**
```json
"dependencies": {
  "@supabase/supabase-js": "^2.75.0"
}
```

### 2. Configuración del cliente

**Archivo renombrado:**
- `src/services/firebase.js` → `src/services/supabase.js`

**Antes (Firebase):**
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

**Ahora (Supabase):**
```javascript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const auth = supabase.auth;
export const db = supabase;
```

### 3. Autenticación

**src/context/AuthContext.jsx**

**Cambios principales:**
- `signInWithEmailAndPassword()` → `supabase.auth.signInWithPassword()`
- `signOut()` → `supabase.auth.signOut()`
- `onAuthStateChanged()` → `supabase.auth.onAuthStateChange()`
- Consultas Firestore → Consultas SQL con Supabase

**Antes (Firebase):**
```javascript
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
```

**Ahora (Supabase):**
```javascript
const { data: authData, error } = await supabase.auth.signInWithPassword({
  email,
  password
});
const { data: userData } = await supabase
  .from('users')
  .select('*')
  .eq('id', authData.user.id)
  .single();
```

### 4. Estructura de datos

**Firebase (NoSQL - Colecciones):**
```
users/ (colección)
  - userId/ (documento)
    - email: string
    - name: string
    - role: string

clientes/ (colección)
  - clienteId/ (documento)
    - nombre: string
    - saldoTotal: number
```

**Supabase (SQL - Tablas relacionales):**
```sql
users (tabla)
  - id: uuid (PK)
  - email: text
  - name: text
  - role: text

clientes (tabla)
  - id: uuid (PK)
  - nombre: text
  - saldo_total: decimal
  - created_by: uuid (FK → users.id)
```

### 5. Variables de entorno

**Nuevo archivo:** `.env.example`
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

## Ventajas de la Migración

### 🚀 Performance
- **PostgreSQL** es más rápido para consultas complejas
- **Índices automáticos** en relaciones
- **Joins nativos** sin duplicar datos

### 💰 Costos
**Plan gratuito de Supabase:**
- 500 MB de base de datos (vs 1 GB de Firebase)
- 50,000 usuarios activos/mes
- 2 GB de bandwidth
- APIs ilimitadas
- **Sin límite de lecturas/escrituras** (Firebase cobra después de 50k/día)

**Plan gratuito de Firebase:**
- 1 GB de almacenamiento
- 10 GB de transferencia/mes
- 50k lecturas/día, 20k escrituras/día
- 20k eliminaciones/día

### 🛠️ Funcionalidades nuevas

1. **Row Level Security (RLS)**
   - Seguridad a nivel de base de datos
   - Políticas SQL declarativas
   - No depende del código frontend

2. **Triggers y Funciones**
   - Lógica del lado del servidor
   - Actualización automática de saldos
   - Validaciones en la base de datos

3. **SQL Real**
   - Relaciones entre tablas
   - Joins eficientes
   - Transacciones ACID

4. **Realtime**
   - Actualizaciones en tiempo real (como Firestore)
   - Basado en PostgreSQL LISTEN/NOTIFY
   - Más eficiente que Firestore

### 🔧 Herramientas

- **Supabase Studio**: Dashboard visual para gestionar datos
- **SQL Editor**: Ejecutar queries SQL directamente
- **API Auto-generada**: REST + GraphQL
- **Table Editor**: Editar datos visualmente
- **Database Migrations**: Versionado de esquema

## Próximos Pasos

Ahora que la migración está completa, los siguientes pasos son:

### 1. Configurar Supabase
Lee `SUPABASE_SETUP.md` para:
- Crear proyecto en Supabase
- Configurar tablas y políticas RLS
- Crear usuario admin
- Obtener credenciales

### 2. Adaptar componentes existentes
A medida que implementes nuevas funcionalidades:
- **CRUD de clientes**: Usar `supabase.from('clientes')`
- **Transacciones**: Aprovechar triggers automáticos
- **Realtime**: `supabase.from('clientes').on('*', callback)`

### 3. Aprovechar funcionalidades SQL

**Ejemplo: Obtener clientes con deuda total**
```javascript
// Con Supabase (más eficiente)
const { data } = await supabase
  .from('clientes')
  .select(`
    *,
    transacciones (
      tipo,
      monto
    )
  `)
  .gt('saldo_total', 0)
  .order('saldo_total', { ascending: false });
```

**Ejemplo: Dashboard con métricas**
```javascript
// Total de ventas del mes
const { data } = await supabase
  .rpc('get_ventas_mes', { mes: '2025-01' });
```

## Compatibilidad

El código se ha migrado manteniendo la compatibilidad con la estructura existente:
- `auth` y `db` siguen exportándose
- Los componentes React no requieren cambios significativos
- La lógica de autenticación es similar

## Recursos de Aprendizaje

- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de migración desde Firebase](https://supabase.com/docs/guides/migrations/firebase-auth)
- [PostgreSQL Tutorial](https://www.postgresql.org/docs/current/tutorial.html)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

## Soporte

Si encuentras problemas durante el desarrollo:
1. Revisa `SUPABASE_SETUP.md` para configuración inicial
2. Consulta la [documentación oficial](https://supabase.com/docs)
3. Revisa los [ejemplos de Supabase](https://github.com/supabase/supabase/tree/master/examples)

---

**Migración completada el:** 14 de Octubre de 2025
**Versión de Supabase:** @supabase/supabase-js v2.75.0
