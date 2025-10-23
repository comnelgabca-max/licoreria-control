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
import MoneyDisplay from '../components/ui/MoneyDisplay';
import { getAllClientes, createCliente, updateCliente, deleteCliente } from '../services/clientesService';
import { getAllTransacciones } from '../services/transaccionesService';
import { useAuth } from '../context/AuthContext';

const Clientes = () => {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDeuda, setFilterDeuda] = useState('todos');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' o 'edit'
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    notas: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Modal de transacciones
  const [showTransaccionesModal, setShowTransaccionesModal] = useState(false);
  const [clienteTransacciones, setClienteTransacciones] = useState(null);
  const [transacciones, setTransacciones] = useState([]);
  const [loadingTransacciones, setLoadingTransacciones] = useState(false);

  // Cargar clientes al montar el componente
  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    setLoading(true);
    try {
      const response = await getAllClientes();
      if (response.success) {
        setClientes(response.data || []);
      } else {
        console.error('Error cargando clientes:', response.error);
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar clientes
  const clientesFiltrados = clientes.filter(cliente => {
    const matchSearch = cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (cliente.telefono && cliente.telefono.includes(searchTerm));

    const matchFilter = filterDeuda === 'todos' ? true :
                       filterDeuda === 'conDeuda' ? cliente.saldo_total > 0 :
                       cliente.saldo_total === 0;

    return matchSearch && matchFilter;
  });

  // Calcular estadísticas
  const totalClientes = clientes.length;
  const clientesConDeuda = clientes.filter(c => c.saldo_total > 0).length;
  const totalDeuda = clientes.reduce((sum, c) => sum + (parseFloat(c.saldo_total) || 0), 0);

  // Abrir modal para crear cliente
  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedCliente(null);
    setFormData({
      nombre: '',
      telefono: '',
      direccion: '',
      notas: ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Abrir modal para editar cliente
  const handleOpenEdit = (cliente) => {
    setModalMode('edit');
    setSelectedCliente(cliente);
    setFormData({
      nombre: cliente.nombre || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      notas: cliente.notas || ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCliente(null);
    setFormData({
      nombre: '',
      telefono: '',
      direccion: '',
      notas: ''
    });
    setFormErrors({});
  };

  // Validar formulario
  const validateForm = () => {
    const errors = {};

    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es obligatorio';
    }

    if (formData.telefono && !/^[0-9\-\s()]+$/.test(formData.telefono)) {
      errors.telefono = 'Formato de teléfono inválido';
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
    // Limpiar error del campo al escribir
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Guardar cliente (crear o editar)
  const handleSaveCliente = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      let response;

      if (modalMode === 'create') {
        response = await createCliente(formData);
      } else {
        response = await updateCliente(selectedCliente.id, formData);
      }

      if (response.success) {
        handleCloseModal();
        loadClientes(); // Recargar la lista
      } else {
        setFormErrors({ general: response.error || 'Error al guardar el cliente' });
      }
    } catch (error) {
      console.error('Error guardando cliente:', error);
      setFormErrors({ general: 'Error al guardar el cliente' });
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar cliente
  const handleDeleteCliente = async (clienteId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await deleteCliente(clienteId);
      if (response.success) {
        loadClientes(); // Recargar la lista
      } else {
        alert('Error al eliminar el cliente: ' + response.error);
      }
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      alert('Error al eliminar el cliente');
    }
  };

  // Ver transacciones del cliente
  const handleVerTransacciones = async (cliente) => {
    setClienteTransacciones(cliente);
    setShowTransaccionesModal(true);
    setLoadingTransacciones(true);

    try {
      const response = await getAllTransacciones({ clienteId: cliente.id });
      if (response.success) {
        setTransacciones(response.data || []);
      } else {
        console.error('Error cargando transacciones:', response.error);
        setTransacciones([]);
      }
    } catch (error) {
      console.error('Error cargando transacciones:', error);
      setTransacciones([]);
    } finally {
      setLoadingTransacciones(false);
    }
  };

  const handleCloseTransaccionesModal = () => {
    setShowTransaccionesModal(false);
    setClienteTransacciones(null);
    setTransacciones([]);
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Clientes</h2>
            <p className="text-gray-600">
              {totalClientes} clientes registrados • {clientesConDeuda} con deuda
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Icon name="plus" size="sm" />}
            iconPosition="left"
            onClick={handleOpenCreate}
          >
            Nuevo Cliente
          </Button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-soft hover border-l-4 border-l-sky-500 animate-slide-up">
            <Card.Body className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Clientes</p>
                <p className="text-3xl font-bold text-gray-900">{totalClientes}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center text-white">
                <Icon name="users" size="lg" />
              </div>
            </Card.Body>
          </Card>

          <Card className="shadow-soft hover border-l-4 border-l-red-500 animate-slide-up animation-delay-100">
            <Card.Body className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Con Deuda</p>
                <p className="text-3xl font-bold text-red-600">{clientesConDeuda}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white">
                <Icon name="trendingUp" size="lg" />
              </div>
            </Card.Body>
          </Card>

          <Card className="shadow-soft hover border-l-4 border-l-amber-500 animate-slide-up animation-delay-200">
            <Card.Body className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Deuda Total</p>
                <MoneyDisplay amount={totalDeuda} size="3xl" color="amber" />
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-white">
                <Icon name="dollarSign" size="lg" />
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Búsqueda y Filtros */}
        <Card className="shadow-soft">
          <Card.Body>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Búsqueda */}
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Buscar por nombre o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Icon name="search" size="sm" />}
                  iconPosition="left"
                />
              </div>

              {/* Filtro de deuda */}
              <div className="flex gap-2">
                <Button
                  variant={filterDeuda === 'todos' ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => setFilterDeuda('todos')}
                >
                  Todos
                </Button>
                <Button
                  variant={filterDeuda === 'conDeuda' ? 'danger' : 'outline'}
                  size="md"
                  onClick={() => setFilterDeuda('conDeuda')}
                >
                  Con Deuda
                </Button>
                <Button
                  variant={filterDeuda === 'sinDeuda' ? 'success' : 'outline'}
                  size="md"
                  onClick={() => setFilterDeuda('sinDeuda')}
                >
                  Al Día
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Lista de Clientes */}
        <Card className="shadow-soft overflow-hidden">
          {clientesFiltrados.length === 0 ? (
            <EmptyState
              icon="👥"
              title="No se encontraron clientes"
              description={clientes.length === 0 ? "Comienza agregando tu primer cliente" : "Intenta ajustar los filtros"}
              action={
                <Button variant="primary" icon={<Icon name="plus" size="sm" />} onClick={handleOpenCreate}>
                  Agregar Cliente
                </Button>
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
                        Cliente
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Contacto
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Última Compra
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Deuda
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {clientesFiltrados.map((cliente, index) => (
                      <tr
                        key={cliente.id}
                        className="hover:bg-gray-50/80 transition-all duration-200 group"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {cliente.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{cliente.nombre}</p>
                              <p className="text-sm text-gray-500 truncate max-w-xs">{cliente.direccion || 'Sin dirección'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900 font-medium">{cliente.telefono || 'Sin teléfono'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">
                            {cliente.ultima_compra
                              ? new Date(cliente.ultima_compra).toLocaleDateString('es-DO', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })
                              : 'Sin compras'
                            }
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <MoneyDisplay
                            amount={cliente.saldo_total || 0}
                            size="lg"
                            color={cliente.saldo_total > 0 ? 'red' : 'green'}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleVerTransacciones(cliente)}
                            >
                              Ver
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(cliente)}
                            >
                              Editar
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCliente(cliente.id)}
                              >
                                Eliminar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista de tarjetas para mobile */}
              <div className="lg:hidden divide-y divide-gray-100">
                {clientesFiltrados.map((cliente, index) => (
                  <div
                    key={cliente.id}
                    className="p-4 hover:bg-gray-50/80 transition-all duration-200"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-sky-600 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                        {cliente.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{cliente.nombre}</h4>
                        <p className="text-sm text-gray-600">{cliente.telefono || 'Sin teléfono'}</p>
                        <p className="text-xs text-gray-500 truncate mt-1">{cliente.direccion || 'Sin dirección'}</p>
                      </div>
                      <MoneyDisplay
                        amount={cliente.saldo_total || 0}
                        size="md"
                        color={cliente.saldo_total > 0 ? 'red' : 'green'}
                        className="items-end"
                      />
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Última compra: {cliente.ultima_compra
                          ? new Date(cliente.ultima_compra).toLocaleDateString('es-DO')
                          : 'Sin compras'
                        }
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleVerTransacciones(cliente)}
                        >
                          Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(cliente)}
                        >
                          Editar
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCliente(cliente.id)}
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

      {/* Modal para crear/editar cliente */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={modalMode === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}
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
              Nombre <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder="Nombre completo del cliente"
              error={formErrors.nombre}
            />
            {formErrors.nombre && (
              <p className="text-red-500 text-xs mt-1">{formErrors.nombre}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <Input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              placeholder="809-555-0000"
              error={formErrors.telefono}
            />
            {formErrors.telefono && (
              <p className="text-red-500 text-xs mt-1">{formErrors.telefono}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <Input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleInputChange}
              placeholder="Calle, ciudad, sector..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleInputChange}
              placeholder="Notas adicionales sobre el cliente..."
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
            />
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
              variant="primary"
              fullWidth
              onClick={handleSaveCliente}
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : (modalMode === 'create' ? 'Crear Cliente' : 'Guardar Cambios')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Ver Transacciones */}
      <Modal
        isOpen={showTransaccionesModal}
        onClose={handleCloseTransaccionesModal}
        title={`Transacciones de ${clienteTransacciones?.nombre || 'Cliente'}`}
        size="xl"
      >
        <div className="space-y-4">
          {/* Estadísticas del cliente */}
          {clienteTransacciones && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Ventas</p>
                <MoneyDisplay
                  amount={transacciones.filter(t => t.tipo === 'venta').reduce((sum, t) => sum + parseFloat(t.monto || 0), 0)}
                  size="xl"
                  color="blue"
                />
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Pagos</p>
                <MoneyDisplay
                  amount={transacciones.filter(t => t.tipo === 'pago').reduce((sum, t) => sum + parseFloat(t.monto || 0), 0)}
                  size="xl"
                  color="green"
                />
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Saldo Actual</p>
                <MoneyDisplay
                  amount={clienteTransacciones.saldo_total || 0}
                  size="xl"
                  color="red"
                />
              </div>
            </div>
          )}

          {/* Lista de transacciones */}
          {loadingTransacciones ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <SkeletonLoader key={i} height="60px" />
              ))}
            </div>
          ) : transacciones.length === 0 ? (
            <EmptyState
              icon="📋"
              title="Sin transacciones"
              description="Este cliente aún no tiene transacciones registradas"
            />
          ) : (
            <div className="overflow-x-auto max-h-96 custom-scrollbar">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Descripción</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transacciones.map((trans) => (
                    <tr key={trans.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(trans.fecha).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={trans.tipo === 'venta' ? 'primary' : 'success'} size="sm">
                          {trans.tipo === 'venta' ? 'Venta' : 'Pago'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {trans.descripcion || 'Sin descripción'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <span className={`text-sm font-semibold ${
                            trans.tipo === 'venta' ? 'text-blue-600' : 'text-green-600'
                          }`}>
                            {trans.tipo === 'venta' ? '+' : '-'}
                          </span>
                          <MoneyDisplay
                            amount={trans.monto || 0}
                            size="sm"
                            color={trans.tipo === 'venta' ? 'blue' : 'green'}
                            className="items-end"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-gray-600">
              Total: {transacciones.length} transacción{transacciones.length !== 1 ? 'es' : ''}
            </p>
            <Button variant="outline" onClick={handleCloseTransaccionesModal}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default Clientes;
