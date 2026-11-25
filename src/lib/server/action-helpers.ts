import { ActionError } from 'astro:actions';
import { createServerSupabase } from './supabase';

// Messages are user-facing, so they stay in Portuguese.
export function requireSupabase() {
  const supabase = createServerSupabase();
  if (!supabase) {
    throw new ActionError({
      code: 'SERVICE_UNAVAILABLE',
      message: 'O serviço está temporariamente indisponível. Tente novamente em instantes.',
    });
  }
  return supabase;
}

export const badRequest = (message: string) => new ActionError({ code: 'BAD_REQUEST', message });
