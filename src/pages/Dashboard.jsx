import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Icon from '../components/ui/Icon';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

// Importar servicios
import { getDashboardStats, getTopDeudores, getActividadReciente } from '../services/dashboardService';
import { createCliente, getAllClientes } from '../services/clientesService';
import { createVenta, createPago } from '../services/transaccionesService';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_clientes: 0,
    clientes_con_deuda: 0,
    total_deudas: 0,
    pagos_hoy: 0,
    ventas_hoy: 0
  });
  const [topDeudores, setTopDeudores] = useState([]);
  const [actividadReciente, setActividadReciente] = useState([]);
  const [clientes, setClientes] = useState([]);

  // Estados para modales
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showTransaccionModal, setShowTransaccionModal] = useState(false);
  const [transaccionTipo, setTransaccionTipo] = useState('venta'); // 'venta' o 'pago'

  // Datos de formularios
  const [clienteFormData, setClienteFormData] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    notas: ''
  });

  const [transaccionFormData, setTransaccionFormData] = useState({
    cliente_id: '',
    monto: '',
    descripcion: ''
  });

  // Errores de formularios
  const [clienteErrors, setClienteErrors] = useState({});
  const [transaccionErrors, setTransaccionErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadDashboardData();
    loadClientes();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Cargar estadísticas
      const statsResponse = await getDashboardStats();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      // Cargar top deudores
      const deudoresResponse = await getTopDeudores(5);
      if (deudoresResponse.success) {
        setTopDeudores(deudoresResponse.data || []);
      }

      // Cargar actividad reciente
      const actividadResponse = await getActividadReciente(6);
      if (actividadResponse.success) {
        setActividadReciente(actividadResponse.data || []);
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClientes = async () => {
    try {
      const response = await getAllClientes();
      if (response.success) {
        setClientes(response.data || []);
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  // Formato de fecha relativa
  const formatearFechaRelativa = (fecha) => {
    const ahora = new Date();
    const fechaTransaccion = new Date(fecha);
    const diffMs = ahora - fechaTransaccion;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays === 1) return 'Ayer';
    return `Hace ${diffDays} días`;
  };

  // ============= FUNCIONES PARA CLIENTE =============
  const handleOpenClienteModal = () => {
    setClienteFormData({ nombre: '', telefono: '', direccion: '', notas: '' });
    setClienteErrors({});
    setShowClienteModal(true);
  };

  const handleCloseClienteModal = () => {
    setShowClienteModal(false);
    setClienteFormData({ nombre: '', telefono: '', direccion: '', notas: '' });
    setClienteErrors({});
  };

  const handleClienteInputChange = (e) => {
    const { name, value } = e.target;
    setClienteFormData(prev => ({ ...prev, [name]: value }));
    if (clienteErrors[name]) {
      setClienteErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateClienteForm = () => {
    const errors = {};
    if (!clienteFormData.nombre.trim()) {
      errors.nombre = 'El nombre es obligatorio';
    }
    if (clienteFormData.telefono && !/^[0-9\-\s()]+$/.test(clienteFormData.telefono)) {
      errors.telefono = 'Formato de teléfono inválido';
    }
    setClienteErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCliente = async () => {
    if (!validateClienteForm()) return;

    setSubmitting(true);
    try {
      const response = await createCliente(clienteFormData);
      if (response.success) {
        handleCloseClienteModal();
        loadDashboardData();
        loadClientes();
      } else {
        setClienteErrors({ general: response.error || 'Error al crear el cliente' });
      }
    } catch (error) {
      console.error('Error creando cliente:', error);
      setClienteErrors({ general: 'Error al crear el cliente' });
    } finally {
      setSubmitting(false);
    }
  };

  // ============= FUNCIONES PARA TRANSACCIÓN =============
  const handleOpenVentaModal = () => {
    setTransaccionTipo('venta');
    setTransaccionFormData({ cliente_id: '', monto: '', descripcion: '' });
    setTransaccionErrors({});
    setShowTransaccionModal(true);
  };

  const handleOpenPagoModal = () => {
    setTransaccionTipo('pago');
    setTransaccionFormData({ cliente_id: '', monto: '', descripcion: '' });
    setTransaccionErrors({});
    setShowTransaccionModal(true);
  };

  const handleCloseTransaccionModal = () => {
    setShowTransaccionModal(false);
    setTransaccionFormData({ cliente_id: '', monto: '', descripcion: '' });
    setTransaccionErrors({});
  };

  const handleTransaccionInputChange = (e) => {
    const { name, value } = e.target;
    setTransaccionFormData(prev => ({ ...prev, [name]: value }));
    if (transaccionErrors[name]) {
      setTransaccionErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateTransaccionForm = () => {
    const errors = {};
    if (!transaccionFormData.cliente_id) {
      errors.cliente_id = 'Debes seleccionar un cliente';
    }
    if (!transaccionFormData.monto || parseFloat(transaccionFormData.monto) <= 0) {
      errors.monto = 'El monto debe ser mayor a 0';
    }
    if (!transaccionFormData.descripcion.trim()) {
      errors.descripcion = 'La descripción es obligatoria';
    }
    setTransaccionErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveTransaccion = async () => {
    if (!validateTransaccionForm()) return;

    setSubmitting(true);
    try {
      const dataToSend = {
        clienteId: transaccionFormData.cliente_id,
        monto: parseFloat(transaccionFormData.monto),
        descripcion: transaccionFormData.descripcion
      };

      let response;
      if (transaccionTipo === 'venta') {
        response = await createVenta(dataToSend);
      } else {
        response = await createPago(dataToSend);
      }

      if (response.success) {
        handleCloseTransaccionModal();
        loadDashboardData();
      } else {
        setTransaccionErrors({ general: response.error || 'Error al guardar la transacción' });
      }
    } catch (error) {
      console.error('Error guardando transacción:', error);
      setTransaccionErrors({ general: 'Error al guardar la transacción' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-8">
          <SkeletonLoader count={4} height={120} />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="animate-slide-down">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Resumen general de tu negocio</p>
        </div>

        {/* Tarjetas de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="animate-slide-up">
            <StatCard
              title="Total Clientes"
              value={stats.total_clientes}
              subtitle={`${stats.clientes_con_deuda} con deuda`}
              icon={<Icon name="users" size="xl" />}
              variant="primary"
            />
          </div>

          <div className="animate-slide-up animation-delay-100">
            <StatCard
              title="Total Deudas"
              value={`$${parseFloat(stats.total_deudas || 0).toFixed(2)}`}
              subtitle="Por cobrar"
              icon={<Icon name="dollarSign" size="xl" />}
              variant="danger"
            />
          </div>

          <div className="animate-slide-up animation-delay-200">
            <StatCard
              title="Pagos Hoy"
              value={`$${parseFloat(stats.pagos_hoy || 0).toFixed(2)}`}
              subtitle="Recibidos"
              icon={<Icon name="check" size="xl" />}
              variant="success"
            />
          </div>

          <div className="animate-slide-up animation-delay-300">
            <StatCard
              title="Ventas Hoy"
              value={`$${parseFloat(stats.ventas_hoy || 0).toFixed(2)}`}
              subtitle="Nuevas deudas"
              icon={<Icon name="shoppingCart" size="xl" />}
              variant="warning"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Actividad Reciente */}
          <Card className="lg:col-span-2 shadow-soft">
            <Card.Header>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
                  <p className="text-sm text-gray-600 mt-1">Últimas transacciones registradas</p>
                </div>
                <Icon name="chartBar" size="lg" className="text-gray-400" />
              </div>
            </Card.Header>

            {actividadReciente.length === 0 ? (
              <EmptyState
                icon="📊"
                title="No hay actividad reciente"
                description="Comienza registrando ventas o pagos"
              />
            ) : (
              <>
                <div className="divide-y divide-gray-100 custom-scrollbar max-h-[500px] overflow-y-auto">
                  {actividadReciente.map((transaccion, index) => (
                    <div
                      key={transaccion.id}
                      className="p-4 hover:bg-gray-50/80 transition-all duration-200 group cursor-pointer"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`
                            p-2.5 rounded-xl transition-all duration-200 group-hover:scale-110
                            ${transaccion.tipo === 'pago'
                              ? 'bg-green-100 text-green-600 group-hover:bg-green-200'
                              : 'bg-amber-100 text-amber-600 group-hover:bg-amber-200'
                            }
                          `}>
                            <Icon
                              name={transaccion.tipo === 'pago' ? 'check' : 'shoppingCart'}
                              size="md"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{transaccion.cliente}</p>
                            <p className="text-sm text-gray-600 truncate">{transaccion.descripcion}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatearFechaRelativa(transaccion.fecha)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`font-bold text-lg ${
                            transaccion.tipo === 'pago' ? 'text-green-600' : 'text-amber-600'
                          }`}>
                            {transaccion.tipo === 'pago' ? '-' : '+'} ${parseFloat(transaccion.monto).toFixed(2)}
                          </p>
                          <Badge
                            variant={transaccion.tipo === 'pago' ? 'success' : 'warning'}
                            size="sm"
                            className="mt-1"
                          >
                            {transaccion.tipo === 'pago' ? 'Pago' : 'Venta'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Card.Footer>
                  <Button
                    variant="ghost"
                    fullWidth
                    icon={<Icon name="arrowRight" size="sm" />}
                    iconPosition="right"
                    onClick={() => navigate('/transacciones')}
                  >
                    Ver todas las transacciones
                  </Button>
                </Card.Footer>
              </>
            )}
          </Card>

          {/* Top Deudores */}
          <Card className="shadow-soft">
            <Card.Header>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Top Deudores</h3>
                  <p className="text-sm text-gray-600 mt-1">Mayores deudas pendientes</p>
                </div>
                <Icon name="trendingUp" size="lg" className="text-red-500" />
              </div>
            </Card.Header>

            {topDeudores.length === 0 ? (
              <EmptyState
                icon="✅"
                title="No hay deudores"
                description="Todos los clientes están al día"
              />
            ) : (
              <>
                <Card.Body className="space-y-4">
                  {topDeudores.map((cliente, index) => (
                    <div
                      key={cliente.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-red-50/50 transition-all duration-200 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                          transition-all duration-200 group-hover:scale-110
                          ${index === 0 ? 'bg-red-500 text-white' :
                            index === 1 ? 'bg-red-400 text-white' :
                            'bg-red-100 text-red-600'}
                        `}>
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{cliente.nombre}</p>
                          <p className="text-xs text-gray-500">Cliente</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">${parseFloat(cliente.deuda).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </Card.Body>

                <Card.Footer>
                  <Button
                    variant="outline"
                    fullWidth
                    icon={<Icon name="users" size="sm" />}
                    iconPosition="left"
                    onClick={() => navigate('/clientes')}
                  >
                    Ver todos los clientes
                  </Button>
                </Card.Footer>
              </>
            )}
          </Card>
        </div>

        {/* Acciones rápidas */}
        <Card className="bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 border-sky-200 shadow-soft-lg">
          <Card.Body>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Acciones Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleOpenClienteModal}
                className="group bg-white/80 backdrop-blur-sm hover:bg-white border-2 border-sky-200/50 hover:border-sky-300 rounded-xl p-5 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-12 h-12 mb-3 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                  <Icon name="plus" size="lg" />
                </div>
                <p className="font-semibold text-gray-900 group-hover:text-sky-600 transition-colors">Nuevo Cliente</p>
                <p className="text-sm text-gray-600 mt-1">Registrar un nuevo cliente</p>
              </button>

              <button
                onClick={handleOpenPagoModal}
                className="group bg-white/80 backdrop-blur-sm hover:bg-white border-2 border-green-200/50 hover:border-green-300 rounded-xl p-5 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-12 h-12 mb-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                  <Icon name="check" size="lg" />
                </div>
                <p className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">Registrar Pago</p>
                <p className="text-sm text-gray-600 mt-1">Cobrar a un cliente</p>
              </button>

              <button
                onClick={handleOpenVentaModal}
                className="group bg-white/80 backdrop-blur-sm hover:bg-white border-2 border-amber-200/50 hover:border-amber-300 rounded-xl p-5 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-12 h-12 mb-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                  <Icon name="shoppingCart" size="lg" />
                </div>
                <p className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">Nueva Venta</p>
                <p className="text-sm text-gray-600 mt-1">Registrar una venta</p>
              </button>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Modal para Nuevo Cliente */}
      <Modal
        isOpen={showClienteModal}
        onClose={handleCloseClienteModal}
        title="Nuevo Cliente"
        size="md"
      >
        <div className="space-y-4">
          {clienteErrors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {clienteErrors.general}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="nombre"
              value={clienteFormData.nombre}
              onChange={handleClienteInputChange}
              placeholder="Nombre completo del cliente"
              error={clienteErrors.nombre}
            />
            {clienteErrors.nombre && (
              <p className="text-red-500 text-xs mt-1">{clienteErrors.nombre}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <Input
              type="tel"
              name="telefono"
              value={clienteFormData.telefono}
              onChange={handleClienteInputChange}
              placeholder="809-555-0000"
              error={clienteErrors.telefono}
            />
            {clienteErrors.telefono && (
              <p className="text-red-500 text-xs mt-1">{clienteErrors.telefono}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <Input
              type="text"
              name="direccion"
              value={clienteFormData.direccion}
              onChange={handleClienteInputChange}
              placeholder="Calle, ciudad, sector..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              name="notas"
              value={clienteFormData.notas}
              onChange={handleClienteInputChange}
              placeholder="Notas adicionales sobre el cliente..."
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              fullWidth
              onClick={handleCloseClienteModal}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleSaveCliente}
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : 'Crear Cliente'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal para Registrar Venta/Pago */}
      <Modal
        isOpen={showTransaccionModal}
        onClose={handleCloseTransaccionModal}
        title={transaccionTipo === 'venta' ? 'Nueva Venta' : 'Registrar Pago'}
        size="md"
      >
        <div className="space-y-4">
          {transaccionErrors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {transaccionErrors.general}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente <span className="text-red-500">*</span>
            </label>
            <select
              name="cliente_id"
              value={transaccionFormData.cliente_id}
              onChange={handleTransaccionInputChange}
              className={`w-full px-4 py-2.5 border ${transaccionErrors.cliente_id ? 'border-red-300' : 'border-gray-300'} rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200`}
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre} {cliente.saldo_total > 0 ? `(Deuda: $${parseFloat(cliente.saldo_total).toFixed(2)})` : ''}
                </option>
              ))}
            </select>
            {transaccionErrors.cliente_id && (
              <p className="text-red-500 text-xs mt-1">{transaccionErrors.cliente_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              name="monto"
              value={transaccionFormData.monto}
              onChange={handleTransaccionInputChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              error={transaccionErrors.monto}
            />
            {transaccionErrors.monto && (
              <p className="text-red-500 text-xs mt-1">{transaccionErrors.monto}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              name="descripcion"
              value={transaccionFormData.descripcion}
              onChange={handleTransaccionInputChange}
              placeholder={transaccionTipo === 'venta' ? 'Ej: Cerveza Presidente 12 pack x 2' : 'Ej: Pago parcial de deuda'}
              rows="3"
              className={`w-full px-4 py-2 border ${transaccionErrors.descripcion ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200`}
            />
            {transaccionErrors.descripcion && (
              <p className="text-red-500 text-xs mt-1">{transaccionErrors.descripcion}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              fullWidth
              onClick={handleCloseTransaccionModal}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              variant={transaccionTipo === 'venta' ? 'warning' : 'success'}
              fullWidth
              onClick={handleSaveTransaccion}
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : (transaccionTipo === 'venta' ? 'Registrar Venta' : 'Registrar Pago')}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default Dashboard;
