import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Icon from '../components/ui/Icon';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import { getAllTransacciones, createVenta, createPago, deleteTransaccion } from '../services/transaccionesService';
import { getAllClientes } from '../services/clientesService';
import { useAuth } from '../context/AuthContext';

const Transacciones = () => {
  const { isAdmin } = useAuth();
  const [transacciones, setTransacciones] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('todas');
  const [filtroFecha, setFiltroFecha] = useState('todas');
  const [busqueda, setBusqueda] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('venta'); // 'venta' o 'pago'
  const [formData, setFormData] = useState({
    cliente_id: '',
    monto: '',
    descripcion: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Cargar datos al montar
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar transacciones y clientes en paralelo
      const [transaccionesRes, clientesRes] = await Promise.all([
        getAllTransacciones(),
        getAllClientes()
      ]);

      console.log('📊 Transacciones Response:', transaccionesRes);
      console.log('📊 Cantidad de transacciones:', transaccionesRes?.data?.length);
      console.log('📊 Primera transacción:', transaccionesRes?.data?.[0]);

      if (transaccionesRes.success) {
        setTransacciones(transaccionesRes.data || []);
      }

      if (clientesRes.success) {
        setClientes(clientesRes.data || []);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar transacciones
  const transaccionesFiltradas = transacciones.filter(t => {
    const matchTipo = filtroTipo === 'todas' ? true :
                     filtroTipo === 'ventas' ? t.tipo === 'venta' :
                     t.tipo === 'pago';

    const matchBusqueda = !busqueda ||
                         (t.cliente?.nombre && t.cliente.nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
                         (t.descripcion && t.descripcion.toLowerCase().includes(busqueda.toLowerCase()));

    const ahora = new Date();
    const fechaTransaccion = new Date(t.fecha);
    let matchFecha = true;

    if (filtroFecha === 'hoy') {
      matchFecha = fechaTransaccion.toDateString() === ahora.toDateString();
    } else if (filtroFecha === 'semana') {
      const unaSemanaAtras = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchFecha = fechaTransaccion >= unaSemanaAtras;
    } else if (filtroFecha === 'mes') {
      matchFecha = fechaTransaccion.getMonth() === new Date().getMonth() &&
                   fechaTransaccion.getFullYear() === new Date().getFullYear();
    }

    return matchTipo && matchBusqueda && matchFecha;
  });

  console.log('🔍 Total transacciones:', transacciones.length);
  console.log('🔍 Transacciones filtradas:', transaccionesFiltradas.length);
  console.log('🔍 Filtros activos:', { filtroTipo, filtroFecha, busqueda });

  // Calcular totales
  const totalVentas = transaccionesFiltradas
    .filter(t => t.tipo === 'venta')
    .reduce((sum, t) => sum + parseFloat(t.monto || 0), 0);

  const totalPagos = transaccionesFiltradas
    .filter(t => t.tipo === 'pago')
    .reduce((sum, t) => sum + parseFloat(t.monto || 0), 0);

  const balance = totalVentas - totalPagos;

  // Abrir modal para nueva venta
  const handleOpenVenta = () => {
    setModalMode('venta');
    setFormData({ cliente_id: '', monto: '', descripcion: '' });
    setFormErrors({});
    setShowModal(true);
  };

  // Abrir modal para nuevo pago
  const handleOpenPago = () => {
    setModalMode('pago');
    setFormData({ cliente_id: '', monto: '', descripcion: '' });
    setFormErrors({});
    setShowModal(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ cliente_id: '', monto: '', descripcion: '' });
    setFormErrors({});
  };

  // Validar formulario
  const validateForm = () => {
    const errors = {};

    if (!formData.cliente_id) {
      errors.cliente_id = 'Debes seleccionar un cliente';
    }

    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      errors.monto = 'El monto debe ser mayor a 0';
    }

    if (!formData.descripcion.trim()) {
      errors.descripcion = 'La descripción es obligatoria';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Guardar transacción
  const handleSaveTransaccion = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      let response;

      const dataToSend = {
        clienteId: formData.cliente_id,
        monto: parseFloat(formData.monto),
        descripcion: formData.descripcion
      };

      if (modalMode === 'venta') {
        response = await createVenta(dataToSend);
      } else {
        response = await createPago(dataToSend);
      }

      if (response.success) {
        handleCloseModal();
        loadData(); // Recargar datos
      } else {
        setFormErrors({ general: response.error || 'Error al guardar la transacción' });
      }
    } catch (error) {
      console.error('Error guardando transacción:', error);
      setFormErrors({ general: 'Error al guardar la transacción' });
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar transacción
  const handleDeleteTransaccion = async (transaccionId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta transacción? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await deleteTransaccion(transaccionId);
      if (response.success) {
        loadData(); // Recargar datos
      } else {
        alert('Error al eliminar la transacción: ' + response.error);
      }
    } catch (error) {
      console.error('Error eliminando transacción:', error);
      alert('Error al eliminar la transacción');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <SkeletonLoader count={1} height={80} />
          <SkeletonLoader count={3} height={120} />
          <SkeletonLoader count={1} height={400} />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-slide-down">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Transacciones</h2>
            <p className="text-gray-600">
              {transaccionesFiltradas.length} transacciones encontradas
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="success"
              icon={<Icon name="check" size="sm" />}
              iconPosition="left"
              onClick={handleOpenPago}
            >
              Registrar Pago
            </Button>
            <Button
              variant="warning"
              icon={<Icon name="shoppingCart" size="sm" />}
              iconPosition="left"
              onClick={handleOpenVenta}
            >
              Nueva Venta
            </Button>
          </div>
        </div>

        {/* Resumen de totales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-soft border-l-4 border-l-amber-500 animate-slide-up">
            <Card.Body className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Ventas</p>
                <p className="text-3xl font-bold text-amber-600">${totalVentas.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {transaccionesFiltradas.filter(t => t.tipo === 'venta').length} transacciones
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-white">
                <Icon name="shoppingCart" size="lg" />
              </div>
            </Card.Body>
          </Card>

          <Card className="shadow-soft border-l-4 border-l-green-500 animate-slide-up animation-delay-100">
            <Card.Body className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Pagos</p>
                <p className="text-3xl font-bold text-green-600">${totalPagos.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {transaccionesFiltradas.filter(t => t.tipo === 'pago').length} transacciones
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white">
                <Icon name="check" size="lg" />
              </div>
            </Card.Body>
          </Card>

          <Card className={`shadow-soft border-l-4 ${
            balance > 0 ? 'border-l-red-500' : 'border-l-sky-500'
          } animate-slide-up animation-delay-200`}>
            <Card.Body className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Balance</p>
                <p className={`text-3xl font-bold ${
                  balance > 0 ? 'text-red-600' : 'text-sky-600'
                }`}>
                  ${Math.abs(balance).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {balance > 0 ? 'Deuda neta' : 'A favor'}
                </p>
              </div>
              <div className={`w-14 h-14 bg-gradient-to-br ${
                balance > 0 ? 'from-red-500 to-red-600' : 'from-sky-500 to-sky-600'
              } rounded-xl flex items-center justify-center text-white`}>
                <Icon name={balance > 0 ? 'trendingUp' : 'dollarSign'} size="lg" />
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="shadow-soft">
          <Card.Body>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Búsqueda */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Buscar</label>
                <Input
                  type="text"
                  placeholder="Cliente o descripción..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  icon={<Icon name="search" size="sm" />}
                  iconPosition="left"
                />
              </div>

              {/* Filtro por tipo */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Tipo</label>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="todas">Todas</option>
                  <option value="ventas">Solo Ventas</option>
                  <option value="pagos">Solo Pagos</option>
                </select>
              </div>

              {/* Filtro por fecha */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Período</label>
                <select
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="todas">Todas</option>
                  <option value="hoy">Hoy</option>
                  <option value="semana">Última Semana</option>
                  <option value="mes">Este Mes</option>
                </select>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Lista de transacciones */}
        <Card className="shadow-soft overflow-hidden">
          {transaccionesFiltradas.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No se encontraron transacciones"
              description={transacciones.length === 0 ? "Comienza registrando una venta o un pago" : "Intenta ajustar los filtros"}
              action={
                <div className="flex gap-2">
                  <Button variant="success" icon={<Icon name="check" size="sm" />} onClick={handleOpenPago}>
                    Registrar Pago
                  </Button>
                  <Button variant="warning" icon={<Icon name="shoppingCart" size="sm" />} onClick={handleOpenVenta}>
                    Nueva Venta
                  </Button>
                </div>
              }
            />
          ) : (
            <>
              {/* Vista de tabla para desktop */}
              <div className="hidden lg:block overflow-x-auto custom-scrollbar">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Monto
                      </th>
                      {isAdmin && (
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Acciones
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {transaccionesFiltradas.map((transaccion, index) => (
                      <tr
                        key={transaccion.id}
                        className="hover:bg-gray-50/80 transition-all duration-200 group"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={transaccion.tipo === 'venta' ? 'warning' : 'success'}
                            size="md"
                            dot
                          >
                            {transaccion.tipo === 'venta' ? 'Venta' : 'Pago'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-sky-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                              {transaccion.cliente?.nombre ? transaccion.cliente.nombre.charAt(0).toUpperCase() : '?'}
                            </div>
                            <p className="font-semibold text-gray-900">{transaccion.cliente?.nombre || 'Cliente eliminado'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 max-w-xs truncate">{transaccion.descripcion}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm text-gray-900 font-medium">
                              {new Date(transaccion.fecha).toLocaleDateString('es-DO', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(transaccion.fecha).toLocaleTimeString('es-DO', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className={`font-bold text-lg ${
                            transaccion.tipo === 'venta' ? 'text-amber-600' : 'text-green-600'
                          }`}>
                            ${parseFloat(transaccion.monto).toFixed(2)}
                          </p>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTransaccion(transaccion.id)}
                            >
                              Eliminar
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista de tarjetas para mobile */}
              <div className="lg:hidden divide-y divide-gray-100">
                {transaccionesFiltradas.map((transaccion, index) => (
                  <div
                    key={transaccion.id}
                    className="p-4 hover:bg-gray-50/80 transition-all duration-200"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`
                          p-2 rounded-lg flex-shrink-0
                          ${transaccion.tipo === 'venta'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-green-100 text-green-600'
                          }
                        `}>
                          <Icon
                            name={transaccion.tipo === 'venta' ? 'shoppingCart' : 'check'}
                            size="md"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{transaccion.cliente?.nombre || 'Cliente eliminado'}</p>
                          <p className="text-sm text-gray-600 truncate">{transaccion.descripcion}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={transaccion.tipo === 'venta' ? 'warning' : 'success'}
                              size="sm"
                            >
                              {transaccion.tipo === 'venta' ? 'Venta' : 'Pago'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(transaccion.fecha).toLocaleDateString('es-DO')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold text-lg ${
                          transaccion.tipo === 'venta' ? 'text-amber-600' : 'text-green-600'
                        }`}>
                          ${parseFloat(transaccion.monto).toFixed(2)}
                        </p>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTransaccion(transaccion.id)}
                          >
                            Eliminar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Modal para registrar venta/pago */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={modalMode === 'venta' ? 'Nueva Venta' : 'Registrar Pago'}
        size="md"
      >
        <div className="space-y-4">
          {formErrors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {formErrors.general}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente <span className="text-red-500">*</span>
            </label>
            <select
              name="cliente_id"
              value={formData.cliente_id}
              onChange={handleInputChange}
              className={`w-full px-4 py-2.5 border ${formErrors.cliente_id ? 'border-red-300' : 'border-gray-300'} rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200`}
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre} {cliente.saldo_total > 0 ? `(Deuda: $${parseFloat(cliente.saldo_total).toFixed(2)})` : ''}
                </option>
              ))}
            </select>
            {formErrors.cliente_id && (
              <p className="text-red-500 text-xs mt-1">{formErrors.cliente_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              name="monto"
              value={formData.monto}
              onChange={handleInputChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              error={formErrors.monto}
            />
            {formErrors.monto && (
              <p className="text-red-500 text-xs mt-1">{formErrors.monto}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              placeholder={modalMode === 'venta' ? 'Ej: Cerveza Presidente 12 pack x 2' : 'Ej: Pago parcial de deuda'}
              rows="3"
              className={`w-full px-4 py-2 border ${formErrors.descripcion ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200`}
            />
            {formErrors.descripcion && (
              <p className="text-red-500 text-xs mt-1">{formErrors.descripcion}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              fullWidth
              onClick={handleCloseModal}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              variant={modalMode === 'venta' ? 'warning' : 'success'}
              fullWidth
              onClick={handleSaveTransaccion}
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : (modalMode === 'venta' ? 'Registrar Venta' : 'Registrar Pago')}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default Transacciones;
