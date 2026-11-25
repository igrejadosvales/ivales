// Server only: this client uses the secret key, which bypasses RLS. Never import it from an island.
import { createClient } from '@supabase/supabase-js';
import { getSecret } from 'astro:env/server';

export function createServerSupabase() {
  const url = getSecret('SUPABASE_URL') ?? getSecret('PUBLIC_SUPABASE_URL');
  const secretKey = getSecret('SUPABASE_SECRET_KEY');
  if (!url || !secretKey) return null;
  // A new client per request, so one member's session is never shared with another.
  return createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
