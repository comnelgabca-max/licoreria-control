# Configuración de Firebase

## Paso 1: Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto"
3. Nombra tu proyecto: "licoreria-control" (o el nombre que prefieras)
4. Desactiva Google Analytics (opcional)
5. Haz clic en "Crear proyecto"

## Paso 2: Configurar Authentication

1. En el menú lateral, ve a "Authentication"
2. Haz clic en "Comenzar"
3. Selecciona "Correo electrónico/Contraseña"
4. Activa "Correo electrónico/Contraseña"
5. Guarda

## Paso 3: Configurar Firestore Database

1. En el menú lateral, ve a "Firestore Database"
2. Haz clic en "Crear base de datos"
3. Selecciona "Comenzar en modo de producción"
4. Elige la ubicación más cercana (ej: us-east1)
5. Haz clic en "Habilitar"

## Paso 4: Configurar reglas de Firestore

Ve a la pestaña "Reglas" y reemplaza el contenido con:

\`\`\`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo usuarios autenticados pueden leer/escribir
    match /{document=**} {
      allow read, write: if request.auth != null;
    }

    // Los usuarios solo pueden ser modificados por admins
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
\`\`\`

## Paso 5: Obtener configuración del proyecto

1. Ve a "Configuración del proyecto" (ícono de engranaje)
2. Baja hasta "Tus aplicaciones"
3. Haz clic en el ícono web (</>)
4. Registra la app con el nombre "licoreria-control-web"
5. Copia la configuración que aparece

## Paso 6: Configurar el proyecto

1. Abre el archivo `src/services/firebase.js`
2. Reemplaza los valores de `firebaseConfig` con los datos que copiaste:

\`\`\`javascript
const firebaseConfig = {
  apiKey: "tu-api-key-aqui",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
\`\`\`

## Paso 7: Crear el primer usuario (Admin)

En Firebase Console, ve a "Authentication" > "Users" y:

1. Haz clic en "Agregar usuario"
2. Email: admin@licoreria.com (o el que prefieras)
3. Contraseña: (elige una segura)
4. Haz clic en "Agregar usuario"
5. Copia el UID del usuario creado

## Paso 8: Crear documento de usuario en Firestore

1. Ve a "Firestore Database"
2. Haz clic en "Iniciar colección"
3. ID de colección: `users`
4. ID de documento: (pega el UID del usuario que creaste)
5. Agrega estos campos:
   - `email` (string): admin@licoreria.com
   - `name` (string): Administrador
   - `role` (string): admin
   - `createdAt` (timestamp): (fecha actual)
6. Guarda

## Paso 9: Probar la aplicación

1. Ejecuta `npm run dev`
2. Abre http://localhost:5173
3. Inicia sesión con las credenciales del admin
4. ¡Listo! Ya puedes usar la aplicación

## Estructura de Firestore

La base de datos tendrá estas colecciones:

### users
\`\`\`
{
  email: string,
  name: string,
  role: 'admin' | 'moderador',
  createdAt: timestamp
}
\`\`\`

### clientes
\`\`\`
{
  nombre: string,
  telefono: string,
  direccion: string,
  saldoTotal: number,
  createdAt: timestamp,
  createdBy: string (userId)
}
\`\`\`

### transacciones
\`\`\`
{
  clienteId: string,
  tipo: 'venta' | 'pago',
  monto: number,
  descripcion: string,
  fecha: timestamp,
  registradoPor: string (userId)
}
\`\`\`
