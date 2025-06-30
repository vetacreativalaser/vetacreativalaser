import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: localStorage, // 🔐 fuerza almacenamiento en localStorage
    autoRefreshToken: true,
  },
});

// Para debug local opcional
if (import.meta.env.DEV) {
  window.supabase = supabase;
}
