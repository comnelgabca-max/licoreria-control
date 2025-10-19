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
    try {
      // 1. Autenticar con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      // 2. Obtener perfil del usuario
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      // Verificar que el usuario esté activo
      if (!profileData.is_active) {
        await supabase.auth.signOut();
        throw new Error('Tu cuenta está desactivada. Contacta al administrador.');
      }

      // 3. Guardar datos del usuario
      setCurrentUser(authData.user);
      setUserRole(profileData.role);

      return { success: true, user: authData.user, profile: profileData };
    } catch (error) {
      console.error('Error en login:', error);
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setCurrentUser(null);
      setUserRole(null);
      return { success: true };
    } catch (error) {
      console.error('Error en logout:', error);
      return { success: false, error: error.message };
    }
  };

  // Observador de cambios de autenticación
  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user);

        // Obtener rol del usuario
        supabase
          .from('profiles')
          .select('role, is_active')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (!error && data) {
              if (data.is_active) {
                setUserRole(data.role);
              } else {
                // Si el usuario está desactivado, cerrar sesión
                supabase.auth.signOut();
                setCurrentUser(null);
                setUserRole(null);
              }
            } else {
              // Si hay error al obtener perfil, cerrar sesión
              console.error('Error al obtener perfil:', error);
              supabase.auth.signOut();
              setCurrentUser(null);
              setUserRole(null);
            }
            setLoading(false);
          })
          .catch((err) => {
            console.error('Error inesperado:', err);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      console.error('Error al obtener sesión:', err);
      setLoading(false);
    });

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setCurrentUser(session.user);

        // Obtener rol
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role, is_active')
          .eq('id', session.user.id)
          .single();

        if (profileData?.is_active) {
          setUserRole(profileData.role);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setUserRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    userRole,
    login,
    logout,
    isAdmin: userRole === 'admin',
    isModerador: userRole === 'moderador'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
