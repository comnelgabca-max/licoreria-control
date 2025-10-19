import { supabase } from './supabase';

/**
 * Servicio CRUD para gestión de Transacciones
 */

// =====================================================
// OBTENER TRANSACCIONES
// =====================================================

/**
 * Obtener todas las transacciones con filtros
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Array>} Lista de transacciones
 */
export const getAllTransacciones = async (filters = {}) => {
  try {
    let query = supabase
      .from('transacciones')
      .select(`
        *,
        cliente:clientes(id, nombre, telefono)
      `)
      .order('fecha', { ascending: false });

    // Filtro por tipo (venta/pago)
    if (filters.tipo) {
      query = query.eq('tipo', filters.tipo);
    }

    // Filtro por cliente
    if (filters.clienteId) {
      query = query.eq('cliente_id', filters.clienteId);
    }

    // Filtro por búsqueda (cliente o descripción)
    if (filters.search) {
      // Nota: Para buscar en campos relacionados, mejor hacer filtrado client-side
      query = query.or(`descripcion.ilike.%${filters.search}%`);
    }

    // Filtro por fecha
    if (filters.fechaInicio) {
      query = query.gte('fecha', filters.fechaInicio);
    }

    if (filters.fechaFin) {
      query = query.lte('fecha', filters.fechaFin);
    }

    // Filtro por periodo
    if (filters.periodo) {
      const now = new Date();
      let startDate;

      switch (filters.periodo) {
        case 'hoy':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'semana':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'mes':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        query = query.gte('fecha', startDate.toISOString());
      }
    }

    // Límite de resultados
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener una transacción por ID
 * @param {string} id - UUID de la transacción
 * @returns {Promise<Object>} Transacción
 */
export const getTransaccionById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('transacciones')
      .select(`
        *,
        cliente:clientes(id, nombre, telefono, direccion)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener transacción:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// CREAR TRANSACCIÓN
// =====================================================

/**
 * Crear nueva venta
 * @param {Object} ventaData - Datos de la venta
 * @returns {Promise<Object>} Venta creada
 */
export const createVenta = async (ventaData) => {
  try {
    const { data: userData } = await supabase.auth.getUser();

    const newVenta = {
      cliente_id: ventaData.clienteId,
      tipo: 'venta',
      monto: parseFloat(ventaData.monto),
      descripcion: ventaData.descripcion,
      fecha: ventaData.fecha || new Date().toISOString(),
      notas: ventaData.notas || null,
      created_by: userData?.user?.id
    };

    const { data, error } = await supabase
      .from('transacciones')
      .insert([newVenta])
      .select(`
        *,
        cliente:clientes(id, nombre, telefono)
      `)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al crear venta:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Crear nuevo pago
 * @param {Object} pagoData - Datos del pago
 * @returns {Promise<Object>} Pago creado
 */
export const createPago = async (pagoData) => {
  try {
    const { data: userData } = await supabase.auth.getUser();

    const newPago = {
      cliente_id: pagoData.clienteId,
      tipo: 'pago',
      monto: parseFloat(pagoData.monto),
      descripcion: pagoData.descripcion,
      fecha: pagoData.fecha || new Date().toISOString(),
      metodo_pago: pagoData.metodoPago || 'efectivo',
      referencia: pagoData.referencia || null,
      notas: pagoData.notas || null,
      created_by: userData?.user?.id
    };

    const { data, error } = await supabase
      .from('transacciones')
      .insert([newPago])
      .select(`
        *,
        cliente:clientes(id, nombre, telefono)
      `)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al crear pago:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// ACTUALIZAR TRANSACCIÓN
// =====================================================

/**
 * Actualizar una transacción
 * @param {string} id - UUID de la transacción
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<Object>} Transacción actualizada
 */
export const updateTransaccion = async (id, updates) => {
  try {
    const { data: userData } = await supabase.auth.getUser();

    const allowedFields = ['monto', 'descripcion', 'fecha', 'metodo_pago', 'referencia', 'notas'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    filteredUpdates.updated_by = userData?.user?.id;

    const { data, error } = await supabase
      .from('transacciones')
      .update(filteredUpdates)
      .eq('id', id)
      .select(`
        *,
        cliente:clientes(id, nombre, telefono)
      `)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al actualizar transacción:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// ELIMINAR TRANSACCIÓN
// =====================================================

/**
 * Eliminar una transacción (solo admins)
 * @param {string} id - UUID de la transacción
 * @returns {Promise<Object>} Resultado de la operación
 */
export const deleteTransaccion = async (id) => {
  try {
    const { data, error } = await supabase
      .from('transacciones')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al eliminar transacción:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// ESTADÍSTICAS
// =====================================================

/**
 * Obtener estadísticas de transacciones
 * @param {Object} filters - Filtros de fecha
 * @returns {Promise<Object>} Estadísticas
 */
export const getTransaccionesStats = async (filters = {}) => {
  try {
    let query = supabase
      .from('transacciones')
      .select('tipo, monto, fecha');

    if (filters.fechaInicio) {
      query = query.gte('fecha', filters.fechaInicio);
    }

    if (filters.fechaFin) {
      query = query.lte('fecha', filters.fechaFin);
    }

    const { data, error } = await query;

    if (error) throw error;

    const stats = {
      totalVentas: data
        .filter(t => t.tipo === 'venta')
        .reduce((sum, t) => sum + parseFloat(t.monto || 0), 0),
      totalPagos: data
        .filter(t => t.tipo === 'pago')
        .reduce((sum, t) => sum + parseFloat(t.monto || 0), 0),
      cantidadVentas: data.filter(t => t.tipo === 'venta').length,
      cantidadPagos: data.filter(t => t.tipo === 'pago').length
    };

    stats.balance = stats.totalVentas - stats.totalPagos;

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener ventas y pagos de hoy
 * @returns {Promise<Object>} Estadísticas del día
 */
export const getStatsHoy = async () => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('transacciones')
      .select('tipo, monto')
      .gte('fecha', hoy.toISOString());

    if (error) throw error;

    const stats = {
      ventasHoy: data
        .filter(t => t.tipo === 'venta')
        .reduce((sum, t) => sum + parseFloat(t.monto || 0), 0),
      pagosHoy: data
        .filter(t => t.tipo === 'pago')
        .reduce((sum, t) => sum + parseFloat(t.monto || 0), 0)
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error al obtener stats de hoy:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener actividad reciente
 * @param {number} limit - Cantidad de transacciones
 * @returns {Promise<Array>} Transacciones recientes
 */
export const getActividadReciente = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('transacciones')
      .select(`
        *,
        cliente:clientes(id, nombre)
      `)
      .order('fecha', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener actividad reciente:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// REPORTES
// =====================================================

/**
 * Generar reporte de ventas por período
 * @param {Date} fechaInicio - Fecha de inicio
 * @param {Date} fechaFin - Fecha de fin
 * @returns {Promise<Array>} Reporte de ventas
 */
export const getReporteVentas = async (fechaInicio, fechaFin) => {
  try {
    const { data, error } = await supabase
      .from('transacciones')
      .select(`
        *,
        cliente:clientes(nombre, telefono)
      `)
      .eq('tipo', 'venta')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al generar reporte de ventas:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generar reporte de pagos por período
 * @param {Date} fechaInicio - Fecha de inicio
 * @param {Date} fechaFin - Fecha de fin
 * @returns {Promise<Array>} Reporte de pagos
 */
export const getReportePagos = async (fechaInicio, fechaFin) => {
  try {
    const { data, error } = await supabase
      .from('transacciones')
      .select(`
        *,
        cliente:clientes(nombre, telefono)
      `)
      .eq('tipo', 'pago')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al generar reporte de pagos:', error);
    return { success: false, error: error.message };
  }
};
