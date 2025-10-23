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
import {
  getCuentasAbiertas,
  createCuenta,
  addItemToCuenta,
  deleteCuentaItem,
  cerrarCuenta,
  getCuentasStats,
} from '../services/cuentasRapidasService';

const CuentasRapidas = () => {
  const [cuentas, setCuentas] = useState([]);
  const [stats, setStats] = useState({
    cuentas_abiertas: 0,
    total_abierto: 0,
    cuentas_pagadas_hoy: 0,
    total_pagado_hoy: 0,
  });
  const [loading, setLoading] = useState(true);

  // Modal para nueva cuenta
  const [showNuevaCuentaModal, setShowNuevaCuentaModal] = useState(false);
  const [nuevaCuentaData, setNuevaCuentaData] = useState({
    nombre_cliente: '',
    mesa: '',
  });
  const [nuevaCuentaErrors, setNuevaCuentaErrors] = useState({});

  // Modal para ver/editar cuenta
  const [showCuentaDetalleModal, setShowCuentaDetalleModal] = useState(false);
  const [cuentaActual, setCuentaActual] = useState(null);
  const [nuevoItemData, setNuevoItemData] = useState({
    descripcion: '',
    cantidad: 1,
    precio_unitario: '',
  });
  const [nuevoItemErrors, setNuevoItemErrors] = useState({});

  // Modal para cerrar cuenta
  const [showCerrarCuentaModal, setShowCerrarCuentaModal] = useState(false);
  const [metodoPago, setMetodoPago] = useState('efectivo');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cuentasRes, statsRes] = await Promise.all([
        getCuentasAbiertas(),
        getCuentasStats(),
      ]);

      if (cuentasRes.success) {
        setCuentas(cuentasRes.data || []);
      }

      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // ========== NUEVA CUENTA ==========
  const handleOpenNuevaCuenta = () => {
    setNuevaCuentaData({ nombre_cliente: '', mesa: '' });
    setNuevaCuentaErrors({});
    setShowNuevaCuentaModal(true);
  };

  const handleCloseNuevaCuenta = () => {
    setShowNuevaCuentaModal(false);
    setNuevaCuentaData({ nombre_cliente: '', mesa: '' });
    setNuevaCuentaErrors({});
  };

  const handleNuevaCuentaInputChange = (e) => {
    const { name, value } = e.target;
    setNuevaCuentaData((prev) => ({ ...prev, [name]: value }));
    if (nuevaCuentaErrors[name]) {
      setNuevaCuentaErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateNuevaCuenta = () => {
    const errors = {};
    if (!nuevaCuentaData.nombre_cliente.trim()) {
      errors.nombre_cliente = 'El nombre del cliente es obligatorio';
    }
    setNuevaCuentaErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCuenta = async () => {
    if (!validateNuevaCuenta()) return;

    setSubmitting(true);
    try {
      const response = await createCuenta(nuevaCuentaData);
      if (response.success) {
        handleCloseNuevaCuenta();
        loadData();
      } else {
        setNuevaCuentaErrors({ general: response.error || 'Error al crear cuenta' });
      }
    } catch (error) {
      console.error('Error creando cuenta:', error);
      setNuevaCuentaErrors({ general: 'Error al crear cuenta' });
    } finally {
      setSubmitting(false);
    }
  };

  // ========== DETALLE DE CUENTA ==========
  const handleOpenCuentaDetalle = (cuenta) => {
    setCuentaActual(cuenta);
    setNuevoItemData({ descripcion: '', cantidad: 1, precio_unitario: '' });
    setNuevoItemErrors({});
    setShowCuentaDetalleModal(true);
  };

  const handleCloseCuentaDetalle = () => {
    setShowCuentaDetalleModal(false);
    setCuentaActual(null);
    setNuevoItemData({ descripcion: '', cantidad: 1, precio_unitario: '' });
    setNuevoItemErrors({});
  };

  const handleNuevoItemInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoItemData((prev) => ({ ...prev, [name]: value }));
    if (nuevoItemErrors[name]) {
      setNuevoItemErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateNuevoItem = () => {
    const errors = {};
    if (!nuevoItemData.descripcion.trim()) {
      errors.descripcion = 'La descripción es obligatoria';
    }
    if (!nuevoItemData.cantidad || nuevoItemData.cantidad <= 0) {
      errors.cantidad = 'La cantidad debe ser mayor a 0';
    }
    if (!nuevoItemData.precio_unitario || parseFloat(nuevoItemData.precio_unitario) <= 0) {
      errors.precio_unitario = 'El precio debe ser mayor a 0';
    }
    setNuevoItemErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddItem = async () => {
    if (!validateNuevoItem()) return;

    setSubmitting(true);
    try {
      const response = await addItemToCuenta(cuentaActual.id, nuevoItemData);
      if (response.success) {
        setNuevoItemData({ descripcion: '', cantidad: 1, precio_unitario: '' });
        // Recargar datos
        const cuentasRes = await getCuentasAbiertas();
        if (cuentasRes.success) {
          setCuentas(cuentasRes.data || []);
          const cuentaActualizada = cuentasRes.data.find((c) => c.id === cuentaActual.id);
          if (cuentaActualizada) {
            setCuentaActual(cuentaActualizada);
          }
        }
      } else {
        setNuevoItemErrors({ general: response.error || 'Error al agregar item' });
      }
    } catch (error) {
      console.error('Error agregando item:', error);
      setNuevoItemErrors({ general: 'Error al agregar item' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('¿Eliminar este item?')) return;

    try {
      const response = await deleteCuentaItem(itemId);
      if (response.success) {
        // Recargar datos
        const cuentasRes = await getCuentasAbiertas();
        if (cuentasRes.success) {
          setCuentas(cuentasRes.data || []);
          const cuentaActualizada = cuentasRes.data.find((c) => c.id === cuentaActual.id);
          if (cuentaActualizada) {
            setCuentaActual(cuentaActualizada);
          }
        }
      }
    } catch (error) {
      console.error('Error eliminando item:', error);
    }
  };

  // ========== CERRAR CUENTA ==========
  const handleOpenCerrarCuenta = () => {
    setMetodoPago('efectivo');
    setShowCuentaDetalleModal(false);
    setShowCerrarCuentaModal(true);
  };

  const handleCloseCerrarCuenta = () => {
    setShowCerrarCuentaModal(false);
    setMetodoPago('efectivo');
    // Reabrir el detalle
    setShowCuentaDetalleModal(true);
  };

  const handleCerrarCuenta = async () => {
    setSubmitting(true);
    try {
      const response = await cerrarCuenta(cuentaActual.id, metodoPago);
      if (response.success) {
        setShowCerrarCuentaModal(false);
        setShowCuentaDetalleModal(false);
        setCuentaActual(null);
        loadData();
      }
    } catch (error) {
      console.error('Error cerrando cuenta:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <SkeletonLoader count={3} height={120} />
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Cuentas Rápidas</h2>
            <p className="text-gray-600">Sistema de notas para clientes en el momento</p>
          </div>
          <Button
            variant="primary"
            icon={<Icon name="plus" size="sm" />}
            iconPosition="left"
            onClick={handleOpenNuevaCuenta}
          >
            Nueva Cuenta
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-soft border-l-4 border-l-sky-500 animate-slide-up">
            <Card.Body className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cuentas Abiertas</p>
                <p className="text-3xl font-bold text-sky-600">{stats.cuentas_abiertas}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center text-white">
                <Icon name="creditCard" size="lg" />
              </div>
            </Card.Body>
          </Card>

          <Card className="shadow-soft border-l-4 border-l-amber-500 animate-slide-up animation-delay-100">
            <Card.Body className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Abierto</p>
                <p className="text-3xl font-bold text-amber-600">${stats.total_abierto.toFixed(2)}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-white">
                <Icon name="dollarSign" size="lg" />
              </div>
            </Card.Body>
          </Card>

          <Card className="shadow-soft border-l-4 border-l-green-500 animate-slide-up animation-delay-200">
            <Card.Body className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pagadas Hoy</p>
                <p className="text-3xl font-bold text-green-600">{stats.cuentas_pagadas_hoy}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white">
                <Icon name="check" size="lg" />
              </div>
            </Card.Body>
          </Card>

          <Card className="shadow-soft border-l-4 border-l-blue-500 animate-slide-up animation-delay-300">
            <Card.Body className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Pagado Hoy</p>
                <p className="text-3xl font-bold text-blue-600">${stats.total_pagado_hoy.toFixed(2)}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white">
                <Icon name="dollarSign" size="lg" />
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Cuentas Abiertas */}
        <Card className="shadow-soft">
          <Card.Header>
            <h3 className="text-lg font-semibold text-gray-900">Cuentas Abiertas</h3>
          </Card.Header>

          {cuentas.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No hay cuentas abiertas"
              description="Crea una nueva cuenta para comenzar"
              action={
                <Button variant="primary" icon={<Icon name="plus" size="sm" />} onClick={handleOpenNuevaCuenta}>
                  Nueva Cuenta
                </Button>
              }
            />
          ) : (
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cuentas.map((cuenta) => (
                  <div
                    key={cuenta.id}
                    onClick={() => handleOpenCuentaDetalle(cuenta)}
                    className="bg-white border-2 border-gray-200 hover:border-sky-400 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg">{cuenta.nombre_cliente}</h4>
                        {cuenta.mesa && (
                          <p className="text-sm text-gray-600">Mesa: {cuenta.mesa}</p>
                        )}
                      </div>
                      <Badge variant="primary" size="sm">
                        Abierta
                      </Badge>
                    </div>

                    <div className="border-t border-gray-100 pt-3 mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Items:</span>
                        <span className="font-semibold text-gray-900">
                          {cuenta.cuenta_items?.length || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total:</span>
                        <span className="text-2xl font-bold text-sky-600">
                          ${parseFloat(cuenta.total || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      {new Date(cuenta.fecha_apertura).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          )}
        </Card>
      </div>

      {/* Modal: Nueva Cuenta */}
      <Modal
        isOpen={showNuevaCuentaModal}
        onClose={handleCloseNuevaCuenta}
        title="Nueva Cuenta"
        size="md"
      >
        <div className="space-y-4">
          {nuevaCuentaErrors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {nuevaCuentaErrors.general}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Cliente <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="nombre_cliente"
              value={nuevaCuentaData.nombre_cliente}
              onChange={handleNuevaCuentaInputChange}
              placeholder="Nombre del cliente"
              error={nuevaCuentaErrors.nombre_cliente}
            />
            {nuevaCuentaErrors.nombre_cliente && (
              <p className="text-red-500 text-xs mt-1">{nuevaCuentaErrors.nombre_cliente}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mesa (Opcional)</label>
            <Input
              type="text"
              name="mesa"
              value={nuevaCuentaData.mesa}
              onChange={handleNuevaCuentaInputChange}
              placeholder="Número de mesa"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" fullWidth onClick={handleCloseNuevaCuenta} disabled={submitting}>
              Cancelar
            </Button>
            <Button variant="primary" fullWidth onClick={handleCreateCuenta} disabled={submitting}>
              {submitting ? 'Creando...' : 'Crear Cuenta'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Detalle de Cuenta */}
      {cuentaActual && (
        <Modal
          isOpen={showCuentaDetalleModal}
          onClose={handleCloseCuentaDetalle}
          title={`${cuentaActual.nombre_cliente}${cuentaActual.mesa ? ` - Mesa ${cuentaActual.mesa}` : ''}`}
          size="lg"
        >
          <div className="space-y-4">
            {/* Total */}
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-700">Total de la Cuenta:</span>
                <span className="text-3xl font-bold text-sky-600">
                  ${parseFloat(cuentaActual.total || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Agregar Item */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold text-gray-900 mb-3">Agregar Item</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <Input
                    type="text"
                    name="descripcion"
                    value={nuevoItemData.descripcion}
                    onChange={handleNuevoItemInputChange}
                    placeholder="Ej: Cerveza Presidente"
                    error={nuevoItemErrors.descripcion}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    name="cantidad"
                    value={nuevoItemData.cantidad}
                    onChange={handleNuevoItemInputChange}
                    placeholder="Cant."
                    min="1"
                    error={nuevoItemErrors.cantidad}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    name="precio_unitario"
                    value={nuevoItemData.precio_unitario}
                    onChange={handleNuevoItemInputChange}
                    placeholder="Precio"
                    step="0.01"
                    min="0"
                    error={nuevoItemErrors.precio_unitario}
                  />
                </div>
                <div className="md:col-span-2">
                  <Button variant="primary" fullWidth onClick={handleAddItem} disabled={submitting}>
                    Agregar
                  </Button>
                </div>
              </div>
              {nuevoItemErrors.general && (
                <p className="text-red-500 text-xs mt-2">{nuevoItemErrors.general}</p>
              )}
            </div>

            {/* Lista de Items */}
            <div className="border border-gray-200 rounded-lg">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900">Items ({cuentaActual.cuenta_items?.length || 0})</h4>
              </div>
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {!cuentaActual.cuenta_items || cuentaActual.cuenta_items.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No hay items en esta cuenta
                  </div>
                ) : (
                  cuentaActual.cuenta_items.map((item) => (
                    <div key={item.id} className="p-3 hover:bg-gray-50 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.descripcion}</p>
                        <p className="text-sm text-gray-600">
                          {item.cantidad} x ${parseFloat(item.precio_unitario).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-900">
                          ${parseFloat(item.subtotal).toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" fullWidth onClick={handleCloseCuentaDetalle}>
                Cerrar
              </Button>
              <Button
                variant="success"
                fullWidth
                onClick={handleOpenCerrarCuenta}
                disabled={!cuentaActual.cuenta_items || cuentaActual.cuenta_items.length === 0}
              >
                Marcar como Pagada
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Cerrar Cuenta */}
      {cuentaActual && (
        <Modal
          isOpen={showCerrarCuentaModal}
          onClose={handleCloseCerrarCuenta}
          title="Cerrar Cuenta"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total a cobrar:</p>
              <p className="text-4xl font-bold text-sky-600">${parseFloat(cuentaActual.total || 0).toFixed(2)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" fullWidth onClick={handleCloseCerrarCuenta} disabled={submitting}>
                Cancelar
              </Button>
              <Button variant="success" fullWidth onClick={handleCerrarCuenta} disabled={submitting}>
                {submitting ? 'Procesando...' : 'Confirmar Pago'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
};

export default CuentasRapidas;
