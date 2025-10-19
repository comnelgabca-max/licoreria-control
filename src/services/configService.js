import { supabase } from './supabase';

/**
 * Servicio para manejar configuraciones del sistema
 */

// Obtener una configuración por clave
export const getConfiguracion = async (clave) => {
  try {
    const { data, error } = await supabase
      .from('configuraciones')
      .select('*')
      .eq('clave', clave)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return { success: false, error: error.message, data: null };
  }
};

// Obtener todas las configuraciones
export const getAllConfiguraciones = async () => {
  try {
    const { data, error } = await supabase
      .from('configuraciones')
      .select('*')
      .order('clave', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener configuraciones:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Actualizar una configuración
export const updateConfiguracion = async (clave, valor, userId) => {
  try {
    const { data, error } = await supabase
      .from('configuraciones')
      .update({
        valor,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('clave', clave)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    return { success: false, error: error.message };
  }
};

// Crear una configuración
export const createConfiguracion = async (clave, valor, descripcion, userId) => {
  try {
    const { data, error } = await supabase
      .from('configuraciones')
      .insert([{
        clave,
        valor,
        descripcion,
        updated_by: userId
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al crear configuración:', error);
    return { success: false, error: error.message };
  }
};

// Suscribirse a cambios en configuraciones
export const subscribeToConfiguraciones = (callback) => {
  const channel = supabase
    .channel('configuraciones_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'configuraciones'
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return channel;
};

// Cancelar suscripción
export const unsubscribeFromConfiguraciones = (channel) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};
