import { supabase } from './supabase';

/**
 * Servicio CRUD para gestión de Clientes
 */

// =====================================================
// OBTENER CLIENTES
// =====================================================

/**
 * Obtener todos los clientes activos
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Array>} Lista de clientes
 */
export const getAllClientes = async (filters = {}) => {
  try {
    let query = supabase
      .from('clientes')
      .select('*')
      .eq('is_active', true)
      .order('nombre', { ascending: true });

    // Filtro por búsqueda (nombre o teléfono)
    if (filters.search) {
      query = query.or(`nombre.ilike.%${filters.search}%,telefono.ilike.%${filters.search}%`);
    }

    // Filtro por deuda
    if (filters.conDeuda === true) {
      query = query.gt('saldo_total', 0);
    } else if (filters.conDeuda === false) {
      query = query.eq('saldo_total', 0);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener un cliente por ID
 * @param {string} id - UUID del cliente
 * @returns {Promise<Object>} Cliente
 */
export const getClienteById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener top deudores usando función de Supabase
 * @param {number} limit - Cantidad de resultados
 * @returns {Promise<Array>} Lista de top deudores
 */
export const getTopDeudores = async (limit = 5) => {
  try {
    const { data, error } = await supabase
      .rpc('get_top_deudores', { limit_count: limit });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener top deudores:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener historial de transacciones de un cliente
 * @param {string} clienteId - UUID del cliente
 * @returns {Promise<Array>} Historial de transacciones
 */
export const getClienteHistorial = async (clienteId) => {
  try {
    const { data, error } = await supabase
      .rpc('get_cliente_historial', { cliente_uuid: clienteId });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener historial:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// CREAR CLIENTE
// =====================================================

/**
 * Crear un nuevo cliente
 * @param {Object} clienteData - Datos del cliente
 * @returns {Promise<Object>} Cliente creado
 */
export const createCliente = async (clienteData) => {
  try {
    const { data: userData } = await supabase.auth.getUser();

    const newCliente = {
      nombre: clienteData.nombre,
      telefono: clienteData.telefono || null,
      direccion: clienteData.direccion || null,
      email: clienteData.email || null,
      notas: clienteData.notas || null,
      created_by: userData?.user?.id
    };

    const { data, error } = await supabase
      .from('clientes')
      .insert([newCliente])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al crear cliente:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// ACTUALIZAR CLIENTE
// =====================================================

/**
 * Actualizar datos de un cliente
 * @param {string} id - UUID del cliente
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<Object>} Cliente actualizado
 */
export const updateCliente = async (id, updates) => {
  try {
    const allowedFields = ['nombre', 'telefono', 'direccion', 'email', 'notas'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    const { data, error } = await supabase
      .from('clientes')
      .update(filteredUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// ELIMINAR CLIENTE (SOFT DELETE)
// =====================================================

/**
 * Desactivar cliente (soft delete)
 * @param {string} id - UUID del cliente
 * @returns {Promise<Object>} Resultado de la operación
 */
export const deleteCliente = async (id) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// ESTADÍSTICAS
// =====================================================

/**
 * Obtener estadísticas generales de clientes
 * @returns {Promise<Object>} Estadísticas
 */
export const getClientesStats = async () => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('saldo_total, is_active');

    if (error) throw error;

    const stats = {
      total: data.filter(c => c.is_active).length,
      conDeuda: data.filter(c => c.is_active && c.saldo_total > 0).length,
      sinDeuda: data.filter(c => c.is_active && c.saldo_total === 0).length,
      totalDeudas: data.reduce((sum, c) => c.is_active ? sum + parseFloat(c.saldo_total || 0) : sum, 0)
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// BÚSQUEDA AVANZADA
// =====================================================

/**
 * Buscar clientes con múltiples criterios
 * @param {Object} searchParams - Parámetros de búsqueda
 * @returns {Promise<Array>} Clientes encontrados
 */
export const searchClientes = async (searchParams) => {
  try {
    let query = supabase
      .from('clientes')
      .select('*')
      .eq('is_active', true);

    if (searchParams.nombre) {
      query = query.ilike('nombre', `%${searchParams.nombre}%`);
    }

    if (searchParams.telefono) {
      query = query.ilike('telefono', `%${searchParams.telefono}%`);
    }

    if (searchParams.minDeuda !== undefined) {
      query = query.gte('saldo_total', searchParams.minDeuda);
    }

    if (searchParams.maxDeuda !== undefined) {
      query = query.lte('saldo_total', searchParams.maxDeuda);
    }

    query = query.order('nombre', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error en búsqueda avanzada:', error);
    return { success: false, error: error.message };
  }
};
