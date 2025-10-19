import { supabase } from './supabase';

/**
 * Servicio para manejar mensajes del chat
 */

// Obtener todos los mensajes del chat
export const getMessages = async () => {
  try {
    const { data, error } = await supabase
      .from('mensajes_chat')
      .select(`
        *,
        usuario:profiles(email, full_name, role)
      `)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    return { data: null, error: error.message };
  }
};

// Crear un nuevo mensaje
export const createMessage = async (mensaje, userId) => {
  try {
    const { data, error } = await supabase
      .from('mensajes_chat')
      .insert([
        {
          mensaje,
          user_id: userId,
          created_at: new Date().toISOString()
        }
      ])
      .select(`
        *,
        usuario:profiles(email, full_name, role)
      `)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al crear mensaje:', error);
    return { data: null, error: error.message };
  }
};

// Eliminar un mensaje (solo para admins o el autor)
export const deleteMessage = async (messageId) => {
  try {
    const { error } = await supabase
      .from('mensajes_chat')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error al eliminar mensaje:', error);
    return { error: error.message };
  }
};

// Suscribirse a nuevos mensajes en tiempo real
export const subscribeToMessages = (callback) => {
  const channel = supabase
    .channel('mensajes_chat_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'mensajes_chat'
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return channel;
};

// Cancelar suscripción
export const unsubscribeFromMessages = (channel) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};
