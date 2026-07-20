import { createClient } from '@supabase/supabase-js';

// Cliente con SERVICE ROLE KEY - solo para operaciones de servidor/admin
// NUNCA importar este archivo en componentes del cliente
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);