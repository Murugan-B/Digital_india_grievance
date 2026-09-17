import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';

export const isServerSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseSecretKey &&
  supabaseSecretKey.trim() !== ''
);

if (!isServerSupabaseConfigured) {
  console.warn(
    '[Server Config Warning]: SUPABASE_URL or SUPABASE_SECRET_KEY is missing in backend/.env. Please configure your secret key credentials.'
  );
}

const clientUrl = supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co';
const clientKey = supabaseSecretKey || 'placeholder-secret-key';

export const supabaseServer = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
