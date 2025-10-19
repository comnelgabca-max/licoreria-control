import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Modal from '../components/ui/Modal';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Icon from '../components/ui/Icon';
import EmptyState from '../components/ui/EmptyState';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import {
  getAllUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  changeUserRole,
  activateUsuario,
  deactivateUsuario
} from '../services/usuariosService';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'moderador'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    setLoading(true);
    const { success, data } = await getAllUsuarios();
    if (success) {
      setUsuarios(data || []);
    }
    setLoading(false);
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '',
        fullName: user.full_name || '',
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        fullName: '',
        role: 'moderador'
      });
    }
    setFormErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      fullName: '',
      role: 'moderador'
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!editingUser && !formData.password) {
      errors.password = 'La contraseña es requerida';
    }

    if (!editingUser && formData.password && formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.fullName.trim()) {
      errors.fullName = 'El nombre completo es requerido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    if (editingUser) {
      // Actualizar usuario
      const { success } = await updateUsuario(editingUser.id, {
        full_name: formData.fullName,
        role: formData.role
      });

      if (success) {
        await loadUsuarios();
        handleCloseModal();
      }
    } else {
      // Crear nuevo usuario
      const { success, error } = await createUsuario({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: formData.role
      });

      if (success) {
        await loadUsuarios();
        handleCloseModal();
      } else {
        setFormErrors({ submit: error || 'Error al crear usuario' });
      }
    }

    setSubmitting(false);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return;
    }

    const { success } = await deleteUsuario(userId);
    if (success) {
      await loadUsuarios();
    }
  };

  const handleToggleActive = async (user) => {
    const { success } = user.is_active
      ? await deactivateUsuario(user.id)
      : await activateUsuario(user.id);

    if (success) {
      await loadUsuarios();
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    const { success } = await changeUserRole(userId, newRole);
    if (success) {
      await loadUsuarios();
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              Gestión de Usuarios
            </h2>
            <p className="text-gray-600 mt-1">Administra los usuarios del sistema</p>
          </div>
          <Button onClick={() => handleOpenModal()} variant="primary" size="lg">
            <Icon name="users" size="sm" />
            Nuevo Usuario
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                <Icon name="users" size="lg" className="text-sky-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{usuarios.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon name="chartBar" size="lg" className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {usuarios.filter(u => u.is_active).length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Icon name="dollarSign" size="lg" className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {usuarios.filter(u => u.role === 'admin').length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Icon name="users" size="lg" className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Moderadores</p>
                <p className="text-2xl font-bold text-gray-900">
                  {usuarios.filter(u => u.role === 'moderador').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Lista de Usuarios */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Usuarios Registrados</h3>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <SkeletonLoader key={i} height="80px" />
                ))}
              </div>
            ) : usuarios.length === 0 ? (
              <EmptyState
                title="No hay usuarios"
                description="Crea tu primer usuario para comenzar"
                icon="users"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuario</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rol</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Creado</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {usuarios.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {user.email?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.full_name || 'Sin nombre'}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleChangeRole(user.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                          >
                            <option value="admin">Admin</option>
                            <option value="moderador">Moderador</option>
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={user.is_active ? 'success' : 'secondary'}>
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-600">
                            {new Date(user.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(user)}
                              className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Icon name="users" size="sm" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(user)}
                              className={`p-2 rounded-lg transition-colors ${
                                user.is_active
                                  ? 'text-orange-600 hover:bg-orange-50'
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                              title={user.is_active ? 'Desactivar' : 'Activar'}
                            >
                              <Icon name={user.is_active ? 'x' : 'chartBar'} size="sm" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Icon name="dollarSign" size="sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Modal Crear/Editar Usuario */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="usuario@ejemplo.com"
              disabled={editingUser !== null}
              className={formErrors.email ? 'border-red-500' : ''}
            />
            {formErrors.email && (
              <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
            )}
          </div>

          {/* Contraseña (solo al crear) */}
          {!editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña *
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className={formErrors.password ? 'border-red-500' : ''}
              />
              {formErrors.password && (
                <p className="text-sm text-red-500 mt-1">{formErrors.password}</p>
              )}
            </div>
          )}

          {/* Nombre Completo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo *
            </label>
            <Input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Ej: Juan Pérez"
              className={formErrors.fullName ? 'border-red-500' : ''}
            />
            {formErrors.fullName && (
              <p className="text-sm text-red-500 mt-1">{formErrors.fullName}</p>
            )}
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              <option value="moderador">Moderador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {/* Error general */}
          {formErrors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{formErrors.submit}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={handleCloseModal}
              variant="secondary"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : editingUser ? 'Actualizar' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
};

export default Usuarios;
