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
      // 1. Autenticar
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      // 2. Obtener perfil (sin verificación estricta)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      // 3. Guardar datos
      setCurrentUser(authData.user);
      setUserRole(profileData?.role || 'admin'); // Default admin si no hay perfil

      return { success: true, user: authData.user };
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
    const loadSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setCurrentUser(session.user);

          // Intentar obtener rol
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          setUserRole(profileData?.role || 'admin');
        }
      } catch (error) {
        console.error('Error cargando sesión:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    // Escuchar cambios
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setCurrentUser(session.user);

        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        setUserRole(data?.role || 'admin');
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    currentUser,
    userRole,
    login,
    logout,
    isAdmin: userRole === 'admin',
    isModerador: userRole === 'moderador'
  };

  console.log('AuthContext:', { loading, currentUser: !!currentUser, userRole });

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
