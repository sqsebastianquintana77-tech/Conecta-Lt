import { createClient } from '@supabase/supabase-js';

// Cliente con ANON KEY - para consultas publicas (respet RLS)
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);