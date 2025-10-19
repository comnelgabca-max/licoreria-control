import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Iniciar sesión con Supabase
  const login = async (email, password) => {
    console.log('🔐 Intentando login...');
    try {
      // 1. Autenticar
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      console.log('✅ Autenticación exitosa:', authData.user.email);

      // 2. Obtener perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('⚠️ Error obteniendo perfil en login:', profileError);
      }

      // 3. Guardar datos (el onAuthStateChange también lo hará, pero lo hacemos aquí para ser inmediato)
      const userRole = profileData?.role || 'moderador';
      console.log('👤 Rol del usuario:', userRole);

      setCurrentUser(authData.user);
      setUserRole(userRole);

      console.log('✅ Login completado exitosamente');
      return { success: true, user: authData.user };
    } catch (error) {
      console.error('❌ Error en login:', error);
      return {
        success: false,
        error: error.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos'
          : error.message
      };
    }
  };

  // Cerrar sesión
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setUserRole(null);
      return { success: true };
    } catch (error) {
      console.error('Error en logout:', error);
      return { success: false, error: error.message };
    }
  };

  // Cargar sesión inicial
  useEffect(() => {
    let mounted = true;
    let authSubscription = null;

    const loadSession = async () => {
      console.log('🔄 Cargando sesión...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Error obteniendo sesión:', error);
          throw error;
        }

        console.log('📝 Sesión obtenida:', session?.user?.email || 'No hay sesión');

        if (!mounted) {
          console.log('⚠️ Componente desmontado, abortando...');
          return;
        }

        if (session?.user) {
          console.log('👤 Usuario autenticado, obteniendo rol...');

          try {
            // Obtener el rol real desde la tabla profiles con timeout
            const profilePromise = supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();

            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout obteniendo perfil')), 5000)
            );

            const { data: profileData, error: profileError } = await Promise.race([
              profilePromise,
              timeoutPromise
            ]);

            if (profileError) {
              console.error('⚠️ Error obteniendo perfil:', profileError);
              setCurrentUser(session.user);
              setUserRole('moderador'); // Default moderador
            } else {
              console.log('✅ Rol obtenido:', profileData?.role);
              setCurrentUser(session.user);
              setUserRole(profileData?.role || 'moderador');
            }
          } catch (profileErr) {
            console.error('❌ Excepción obteniendo perfil:', profileErr);
            setCurrentUser(session.user);
            setUserRole('moderador');
          }
        } else {
          console.log('❌ No hay usuario autenticado');
          setCurrentUser(null);
          setUserRole(null);
        }

        console.log('✅ Finalizando carga...');
        setLoading(false);
      } catch (error) {
        console.error('❌ Error cargando sesión:', error);
        if (mounted) {
          setCurrentUser(null);
          setUserRole(null);
          setLoading(false);
        }
      }
    };

    loadSession();

    // Escuchar cambios - SIMPLIFICADO para evitar consultas adicionales
    try {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔔 Auth state change:', event);

        if (!mounted) {
          console.log('⚠️ Cambio de auth ignorado, componente desmontado');
          return;
        }

        // Solo manejar SIGNED_OUT, el login ya establece el usuario y rol
        if (event === 'SIGNED_OUT') {
          console.log('🚪 SIGNED_OUT detectado');
          setCurrentUser(null);
          setUserRole(null);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed');
          // No hacer nada, mantener el estado actual
        } else {
          console.log('ℹ️ Evento de auth:', event);
          // SIGNED_IN se maneja en la función login(), no aquí
        }
      });

      authSubscription = data?.subscription || null;
      console.log('✅ Auth listener configurado');
    } catch (subError) {
      console.error('❌ Error configurando auth listener:', subError);
    }

    return () => {
      console.log('🧹 Limpiando AuthContext...');
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    login,
    logout,
    isAdmin: userRole === 'admin',
    isModerador: userRole === 'moderador'
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
