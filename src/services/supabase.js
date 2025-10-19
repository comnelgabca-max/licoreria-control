import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
// IMPORTANTE: Reemplaza estos valores con los de tu proyecto Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'TU_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'TU_SUPABASE_ANON_KEY';

// Inicializar cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Exportaciones para compatibilidad con código existente
export const auth = supabase.auth;
export const db = supabase;
