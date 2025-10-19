import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { currentUser, isAdmin, userRole, loading } = useAuth();

  console.log('🛡️ ProtectedRoute - loading:', loading, 'currentUser:', !!currentUser, 'userRole:', userRole);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Verificando autenticación...</p>
      </div>
    );
  }

  // Si no hay usuario, redirigir a login
  if (!currentUser) {
    console.log('🚫 No hay usuario, redirigiendo a login');
    return <Navigate to="/login" replace />;
  }

  // Si requiere admin y no lo es, redirigir al inicio
  if (requireAdmin && !isAdmin) {
    console.log('🚫 Requiere admin, redirigiendo a inicio');
    return <Navigate to="/" replace />;
  }

  console.log('✅ Acceso permitido');
  return children;
};

export default ProtectedRoute;
