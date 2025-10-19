import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import {
  getConfiguracion,
  updateConfiguracion,
  subscribeToConfiguraciones,
  unsubscribeFromConfiguraciones
} from '../../services/configService';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [precioDolar, setPrecioDolar] = useState('0.00');
  const [modalDolarOpen, setModalDolarOpen] = useState(false);
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [savingPrecio, setSavingPrecio] = useState(false);
  const { currentUser, logout, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Cargar precio del dólar
  useEffect(() => {
    loadPrecioDolar();

    // Suscribirse a cambios en tiempo real
    const channel = subscribeToConfiguraciones(async (payload) => {
      if (payload.new?.clave === 'precio_dolar') {
        setPrecioDolar(payload.new.valor);
      }
    });

    return () => {
      unsubscribeFromConfiguraciones(channel);
    };
  }, []);

  const loadPrecioDolar = async () => {
    const { success, data } = await getConfiguracion('precio_dolar');
    if (success && data) {
      setPrecioDolar(data.valor);
    }
  };

  const handleOpenModalDolar = () => {
    setNuevoPrecio(precioDolar);
    setModalDolarOpen(true);
  };

  const handleCloseModalDolar = () => {
    setModalDolarOpen(false);
    setNuevoPrecio('');
  };

  const handleSavePrecioDolar = async (e) => {
    e.preventDefault();

    if (!nuevoPrecio || isNaN(parseFloat(nuevoPrecio))) {
      alert('Por favor ingresa un precio válido');
      return;
    }

    setSavingPrecio(true);
    const { success, error } = await updateConfiguracion('precio_dolar', nuevoPrecio, currentUser.id);

    if (success) {
      setPrecioDolar(nuevoPrecio);
      handleCloseModalDolar();
    } else {
      console.error('Error detallado:', error);
      alert('Error al actualizar el precio: ' + (error || 'Desconocido'));
    }

    setSavingPrecio(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: 'chartBar', roles: ['admin', 'moderador'] },
    { path: '/clientes', label: 'Clientes', icon: 'users', roles: ['admin', 'moderador'] },
    { path: '/transacciones', label: 'Transacciones', icon: 'dollarSign', roles: ['admin', 'moderador'] },
    { path: '/chat', label: 'Chat', icon: 'users', roles: ['admin', 'moderador'] },
    { path: '/usuarios', label: 'Usuarios', icon: 'users', roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    item.roles.includes(userRole)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30 border-b border-gray-200">
        <div className="flex items-center justify-between px-4 lg:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Icon name="dollarSign" size="lg" className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                  Control de Licorería
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Sistema de gestión</p>
              </div>

              {/* Precio del Dólar */}
              <div className="hidden md:flex items-center gap-2 ml-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                <Icon name="dollarSign" size="sm" className="text-green-600" />
                <div>
                  <p className="text-xs text-gray-600">Precio del dólar:</p>
                  <p className="text-sm font-bold text-green-700">{precioDolar} Bs.</p>
                </div>
                {userRole === 'admin' && (
                  <button
                    onClick={handleOpenModalDolar}
                    className="ml-2 p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                    title="Editar precio"
                  >
                    <Icon name="users" size="sm" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User info */}
            <div className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {currentUser?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{currentUser?.email}</p>
                <Badge variant="primary" size="sm" className="mt-0.5">
                  {userRole}
                </Badge>
              </div>
            </div>

            {/* Logout button */}
            <Button
              onClick={handleLogout}
              variant="danger"
              size="md"
            >
              <span className="hidden sm:inline">Salir</span>
              <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 bg-white min-h-[calc(100vh-73px)] border-r border-gray-200 sticky top-[73px]">
          <nav className="p-4 space-y-1">
            {filteredMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon name={item.icon} size="md" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <div className="p-4 bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl border border-sky-200">
              <p className="text-xs font-semibold text-gray-700 mb-1">Sistema Moderno</p>
              <p className="text-xs text-gray-600">React 19 + Tailwind v4</p>
            </div>
          </div>
        </aside>

        {/* Sidebar - Mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl animate-slide-right">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Icon name="dollarSign" size="md" className="text-white" />
                  </div>
                  <span className="font-semibold text-gray-900">Menú</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Mobile user info */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {currentUser?.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{currentUser?.email}</p>
                    <Badge variant="primary" size="sm" className="mt-1">
                      {userRole}
                    </Badge>
                  </div>
                </div>
              </div>

              <nav className="p-4 space-y-1">
                {filteredMenuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                        ${isActive
                          ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon name={item.icon} size="md" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 min-h-[calc(100vh-73px)]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Modal Editar Precio del Dólar */}
      <Modal
        isOpen={modalDolarOpen}
        onClose={handleCloseModalDolar}
        title="Actualizar Precio del Dólar"
        size="sm"
      >
        <form onSubmit={handleSavePrecioDolar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nuevo Precio (Bs.)
            </label>
            <Input
              type="number"
              step="0.01"
              value={nuevoPrecio}
              onChange={(e) => setNuevoPrecio(e.target.value)}
              placeholder="Ej: 45.50"
              required
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Este precio se mostrará en todo el sistema
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={handleCloseModalDolar}
              variant="secondary"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={savingPrecio}
            >
              {savingPrecio ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MainLayout;
