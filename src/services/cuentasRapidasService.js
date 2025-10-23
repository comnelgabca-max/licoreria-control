import { supabase } from './supabase';

// ==================== CUENTAS RÁPIDAS ====================

// Obtener todas las cuentas (abiertas y pagadas)
export const getAllCuentas = async (filtroEstado = 'todas') => {
  try {
    let query = supabase
      .from('cuentas_rapidas')
      .select('*')
      .order('fecha_apertura', { ascending: false });

    if (filtroEstado === 'abiertas') {
      query = query.eq('estado', 'abierta');
    } else if (filtroEstado === 'pagadas') {
      query = query.eq('estado', 'pagada');
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error obteniendo cuentas:', error);
    return { success: false, error: error.message };
  }
};

// Obtener solo cuentas abiertas
export const getCuentasAbiertas = async () => {
  try {
    const { data, error } = await supabase
      .from('cuentas_rapidas')
      .select('*, cuenta_items(*)')
      .eq('estado', 'abierta')
      .order('fecha_apertura', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error obteniendo cuentas abiertas:', error);
    return { success: false, error: error.message };
  }
};

// Obtener una cuenta específica con sus items
export const getCuentaById = async (cuentaId) => {
  try {
    const { data, error } = await supabase
      .from('cuentas_rapidas')
      .select('*, cuenta_items(*)')
      .eq('id', cuentaId)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error obteniendo cuenta:', error);
    return { success: false, error: error.message };
  }
};

// Crear una nueva cuenta
export const createCuenta = async (cuentaData) => {
  try {
    const { data, error } = await supabase
      .from('cuentas_rapidas')
      .insert([
        {
          nombre_cliente: cuentaData.nombre_cliente,
          mesa: cuentaData.mesa || null,
          notas: cuentaData.notas || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error creando cuenta:', error);
    return { success: false, error: error.message };
  }
};

// Actualizar cuenta
export const updateCuenta = async (cuentaId, cuentaData) => {
  try {
    const { data, error } = await supabase
      .from('cuentas_rapidas')
      .update({
        nombre_cliente: cuentaData.nombre_cliente,
        mesa: cuentaData.mesa,
        notas: cuentaData.notas,
      })
      .eq('id', cuentaId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error actualizando cuenta:', error);
    return { success: false, error: error.message };
  }
};

// Cerrar cuenta (marcar como pagada)
export const cerrarCuenta = async (cuentaId, metodoPago = 'efectivo') => {
  try {
    const { data, error } = await supabase
      .from('cuentas_rapidas')
      .update({
        estado: 'pagada',
        fecha_cierre: new Date().toISOString(),
        metodo_pago: metodoPago,
      })
      .eq('id', cuentaId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error cerrando cuenta:', error);
    return { success: false, error: error.message };
  }
};

// Eliminar cuenta (solo admins)
export const deleteCuenta = async (cuentaId) => {
  try {
    const { error } = await supabase
      .from('cuentas_rapidas')
      .delete()
      .eq('id', cuentaId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error eliminando cuenta:', error);
    return { success: false, error: error.message };
  }
};

// ==================== ITEMS DE CUENTA ====================

// Obtener items de una cuenta
export const getCuentaItems = async (cuentaId) => {
  try {
    const { data, error } = await supabase
      .from('cuenta_items')
      .select('*')
      .eq('cuenta_id', cuentaId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error obteniendo items de cuenta:', error);
    return { success: false, error: error.message };
  }
};

// Agregar item a una cuenta
export const addItemToCuenta = async (cuentaId, itemData) => {
  try {
    const { data, error } = await supabase
      .from('cuenta_items')
      .insert([
        {
          cuenta_id: cuentaId,
          descripcion: itemData.descripcion,
          cantidad: itemData.cantidad || 1,
          precio_unitario: parseFloat(itemData.precio_unitario),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error agregando item:', error);
    return { success: false, error: error.message };
  }
};

// Actualizar item
export const updateCuentaItem = async (itemId, itemData) => {
  try {
    const { data, error } = await supabase
      .from('cuenta_items')
      .update({
        descripcion: itemData.descripcion,
        cantidad: itemData.cantidad,
        precio_unitario: parseFloat(itemData.precio_unitario),
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error actualizando item:', error);
    return { success: false, error: error.message };
  }
};

// Eliminar item de cuenta
export const deleteCuentaItem = async (itemId) => {
  try {
    const { error } = await supabase
      .from('cuenta_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error eliminando item:', error);
    return { success: false, error: error.message };
  }
};

// ==================== ESTADÍSTICAS ====================

// Obtener estadísticas de cuentas rápidas
export const getCuentasStats = async () => {
  try {
    // Obtener estadísticas manualmente
    const { data: cuentasAbiertas, error: error1 } = await supabase
      .from('cuentas_rapidas')
      .select('total')
      .eq('estado', 'abierta');

    if (error1) throw error1;

    const { data: cuentasPagadasHoy, error: error2 } = await supabase
      .from('cuentas_rapidas')
      .select('total')
      .eq('estado', 'pagada')
      .gte('fecha_cierre', new Date().toISOString().split('T')[0]);

    if (error2) throw error2;

    const stats = {
      cuentas_abiertas: cuentasAbiertas?.length || 0,
      total_abierto: cuentasAbiertas?.reduce((sum, c) => sum + parseFloat(c.total || 0), 0) || 0,
      cuentas_pagadas_hoy: cuentasPagadasHoy?.length || 0,
      total_pagado_hoy: cuentasPagadasHoy?.reduce((sum, c) => sum + parseFloat(c.total || 0), 0) || 0,
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return { success: false, error: error.message };
  }
};
