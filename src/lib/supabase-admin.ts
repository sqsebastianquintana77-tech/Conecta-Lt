import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cliente con SERVICE ROLE KEY - solo para operaciones de servidor/admin
// NUNCA importar este archivo en componentes del cliente
// Soporta tanto las variables sin prefijo como con NEXT_PUBLIC_ para compatibilidad

let _adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_adminClient) return _adminClient;

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('[supabase-admin] Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY');
  }

  _adminClient = createClient(supabaseUrl, supabaseServiceKey);
  return _adminClient;
}

// Alias para compatibilidad con imports existentes
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return Reflect.get(getSupabaseAdmin(), prop);
  },
});