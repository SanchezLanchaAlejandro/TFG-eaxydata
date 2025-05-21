import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase. Por favor, verifica tu archivo .env.local');
}

// Creamos el cliente de Supabase con tipado
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Función para verificar la conexión con Supabase
export const testSupabaseConnection = async (): Promise<{ ok: boolean; message: string }> => {
  try {
    // Intentar una consulta simple
    const { data, error } = await supabase.from('facturas').select('count').limit(1).maybeSingle();
    
    if (error) {
      console.error('Error al conectar con Supabase:', error);
      return { ok: false, message: `Error de conexión: ${error.message}` };
    }
    
    return { ok: true, message: 'Conexión exitosa con Supabase' };
  } catch (err: any) {
    console.error('Error grave al conectar con Supabase:', err);
    return { ok: false, message: `Error grave: ${err.message}` };
  }
};

export default supabase; 