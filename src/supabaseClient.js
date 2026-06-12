import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Eğer env değerleri henüz girilmediyse app'in çökmesini engellemek için kontrol ekliyoruz:
export const isSupabaseConfigured = 
  supabaseUrl && supabaseUrl !== 'buraya_url_gelecek' &&
  supabaseAnonKey && supabaseAnonKey !== 'buraya_publishable_key_gelecek';

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
