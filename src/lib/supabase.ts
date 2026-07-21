import { createClient } from '@supabase/supabase-js';

// Cliente con ANON KEY - para consultas publicas (respeta RLS)
// Soporta tanto las variables sin prefijo como con NEXT_PUBLIC_ para compatibilidad
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[supabase] Faltan SUPABASE_URL y/o SUPABASE_ANON_KEY en las variables de entorno');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);