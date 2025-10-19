import { supabase } from './supabase';

/**
 * Servicio CRUD para gestión de Usuarios
 */

// =====================================================
// OBTENER USUARIOS
// =====================================================

/**
 * Obtener todos los usuarios (perfiles)
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Array>} Lista de usuarios
 */
export const getAllUsuarios = async (filters = {}) => {
  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    // Filtro por rol
    if (filters.role) {
      query = query.eq('role', filters.role);
    }

    // Filtro por estado activo
    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    // Búsqueda por email o nombre
    if (filters.search) {
      query = query.or(`email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener un usuario por ID
 * @param {string} id - UUID del usuario
 * @returns {Promise<Object>} Usuario
 */
export const getUsuarioById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener el perfil del usuario actual
 * @returns {Promise<Object>} Perfil del usuario actual
 */
export const getCurrentUserProfile = async () => {
  try {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      throw new Error('No hay usuario autenticado');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener perfil actual:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// CREAR USUARIO
// =====================================================

/**
 * Crear nuevo usuario usando Edge Function (seguro)
 * @param {Object} userData - Datos del usuario
 * @returns {Promise<Object>} Usuario creado
 */
export const createUsuario = async (userData) => {
  try {
    // Obtener el token del usuario actual
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('No hay sesión activa');
    }

    // Llamar a la Edge Function
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
        email: userData.email,
        password: userData.password,
        fullName: userData.fullName,
        role: userData.role || 'moderador'
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      throw error;
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Invitar usuario por email (envía invitación)
 * @param {Object} inviteData - Datos de la invitación
 * @returns {Promise<Object>} Resultado
 */
export const inviteUsuario = async (inviteData) => {
  try {
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(
      inviteData.email,
      {
        data: {
          full_name: inviteData.fullName || null,
          role: inviteData.role || 'moderador'
        }
      }
    );

    if (error) throw error;

    // Crear perfil pendiente
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: data.user.id,
        email: inviteData.email,
        role: inviteData.role || 'moderador',
        full_name: inviteData.fullName || null,
        is_active: false // Se activará cuando acepte la invitación
      }])
      .select()
      .single();

    if (profileError) throw profileError;

    return { success: true, data: profileData };
  } catch (error) {
    console.error('Error al invitar usuario:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// ACTUALIZAR USUARIO
// =====================================================

/**
 * Actualizar perfil de usuario
 * @param {string} id - UUID del usuario
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<Object>} Usuario actualizado
 */
export const updateUsuario = async (id, updates) => {
  try {
    const allowedFields = ['role', 'full_name', 'avatar_url', 'is_active'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    const { data, error } = await supabase
      .from('profiles')
      .update(filteredUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Actualizar perfil propio
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<Object>} Perfil actualizado
 */
export const updateOwnProfile = async (updates) => {
  try {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      throw new Error('No hay usuario autenticado');
    }

    // Solo permitir actualizar ciertos campos
    const allowedFields = ['full_name', 'avatar_url'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    const { data, error } = await supabase
      .from('profiles')
      .update(filteredUpdates)
      .eq('id', userData.user.id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al actualizar perfil propio:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cambiar contraseña de usuario
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<Object>} Resultado
 */
export const changePassword = async (newPassword) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cambiar rol de usuario (solo admin)
 * @param {string} userId - UUID del usuario
 * @param {string} newRole - Nuevo rol (admin/moderador)
 * @returns {Promise<Object>} Usuario actualizado
 */
export const changeUserRole = async (userId, newRole) => {
  try {
    if (!['admin', 'moderador'].includes(newRole)) {
      throw new Error('Rol inválido');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al cambiar rol:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// ELIMINAR / DESACTIVAR USUARIO
// =====================================================

/**
 * Desactivar usuario (soft delete)
 * @param {string} id - UUID del usuario
 * @returns {Promise<Object>} Resultado
 */
export const deactivateUsuario = async (id) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al desactivar usuario:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Activar usuario
 * @param {string} id - UUID del usuario
 * @returns {Promise<Object>} Resultado
 */
export const activateUsuario = async (id) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al activar usuario:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Eliminar usuario permanentemente (solo admin)
 * @param {string} id - UUID del usuario
 * @returns {Promise<Object>} Resultado
 */
export const deleteUsuario = async (id) => {
  try {
    // 1. Eliminar perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (profileError) throw profileError;

    // 2. Eliminar usuario de Auth (requiere permisos de admin)
    const { error: authError } = await supabase.auth.admin.deleteUser(id);

    if (authError) throw authError;

    return { success: true };
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// ESTADÍSTICAS Y ACTIVIDAD
// =====================================================

/**
 * Obtener estadísticas de usuarios
 * @returns {Promise<Object>} Estadísticas
 */
export const getUsuariosStats = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, is_active');

    if (error) throw error;

    const stats = {
      total: data.length,
      activos: data.filter(u => u.is_active).length,
      inactivos: data.filter(u => !u.is_active).length,
      admins: data.filter(u => u.role === 'admin').length,
      moderadores: data.filter(u => u.role === 'moderador').length
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error al obtener estadísticas de usuarios:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener actividad de un usuario (audit logs)
 * @param {string} userId - UUID del usuario
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>} Actividad del usuario
 */
export const getUsuarioActivity = async (userId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener actividad de usuario:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener todos los audit logs (solo admin)
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Array>} Audit logs
 */
export const getAllAuditLogs = async (filters = {}) => {
  try {
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        user:profiles(email, full_name)
      `)
      .order('created_at', { ascending: false });

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.tableName) {
      query = query.eq('table_name', filters.tableName);
    }

    if (filters.action) {
      query = query.eq('action', filters.action);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    } else {
      query = query.limit(100);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener audit logs:', error);
    return { success: false, error: error.message };
  }
};
