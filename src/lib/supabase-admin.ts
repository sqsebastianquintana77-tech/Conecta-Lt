import { createClient } from '@supabase/supabase-js';

// Cliente con SERVICE ROLE KEY - solo para operaciones de servidor/admin
// NUNCA importar este archivo en componentes del cliente
// Soporta tanto las variables sin prefijo como con NEXT_PUBLIC_ para compatibilidad
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[supabase-admin] Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);