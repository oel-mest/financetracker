import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl:  string = import.meta.env.VITE_SUPABASE_URL
const supabaseAnon: string = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnon) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnon)