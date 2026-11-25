import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { parseCredentials, parseSignUp } from '../lib/member-auth';
import { badRequest, requireSupabase } from '../lib/server/action-helpers';
import { clearSession, currentMemberId, saveSession } from '../lib/server/session';

type ServerSupabase = ReturnType<typeof requireSupabase>;

const safeNext = (next?: string) =>
  next && next.startsWith('/') && !next.startsWith('//') ? `?next=${encodeURIComponent(next)}` : '';

async function findProfile(supabase: ServerSupabase, id: string) {
  const { data, error } = await supabase.from('member_profiles').select('*').eq('id', id).maybeSingle();
  if (error) console.error('profile lookup failed:', error.code);
  return data as Record<string, any> | null;
}

export const members = {
  signUp: defineAction({
    input: z.object({
      email: z.string(),
      password: z.string(),
      fullName: z.string(),
      phone: z.string(),
      // Same-site path to return to after confirming the e-mail (e.g. the volunteer sign-up).
      next: z.string().max(200).optional(),
    }),
    handler: async (body, context) => {
      const { data: input, error: invalid } = parseSignUp(body);
      if (!input) throw badRequest(invalid!);
      const supabase = requireSupabase();

      // signUp (not admin.createUser) keeps Supabase's e-mail confirmation rules in force.
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: { full_name: input.fullName, phone: input.phone },
          emailRedirectTo: `${context.url.origin}/membros${safeNext(body.next)}`,
        },
      });
      if (error) {
        console.error('sign-up failed:', error.status, error.code);
        throw badRequest(
          /already|registered/i.test(error.message)
            ? 'Este e-mail já está cadastrado. Entre com sua senha.'
            : 'Não foi possível concluir o cadastro. Tente novamente.',
        );
      }

      if (!data.session || !data.user) return { needsConfirmation: true, profile: null };
      saveSession(context.cookies, data.session);
      return { needsConfirmation: false, profile: await findProfile(supabase, data.user.id) };
    },
  }),

  login: defineAction({
    input: z.object({ email: z.string(), password: z.string() }),
    handler: async (body, context) => {
      const { data: input, error: invalid } = parseCredentials(body);
      if (!input) throw badRequest(invalid!);
      const supabase = requireSupabase();

      const { data, error } = await supabase.auth.signInWithPassword(input);
      if (error || !data.user || !data.session) {
        throw new ActionError({ code: 'UNAUTHORIZED', message: 'E-mail ou senha incorretos.' });
      }
      saveSession(context.cookies, data.session);
      return { profile: await findProfile(supabase, data.user.id) };
    },
  }),

  // Who is signed in (null when nobody), for pages that need the member, like the volunteer sign-up.
  me: defineAction({
    handler: async (_input, context) => {
      const memberId = await currentMemberId(context.cookies);
      if (!memberId) return { profile: null };
      return { profile: await findProfile(requireSupabase(), memberId) };
    },
  }),

  logout: defineAction({
    handler: async (_input, context) => {
      clearSession(context.cookies);
      return { ok: true };
    },
  }),
};
