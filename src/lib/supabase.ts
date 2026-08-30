import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Configuração do Supabase em falta. Cria um ficheiro .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (vê .env.example).',
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
