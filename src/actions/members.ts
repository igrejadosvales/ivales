import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { parseCredentials, parseSignUp } from '../lib/member-auth';
import { badRequest, requireSupabase } from '../lib/server/action-helpers';

type ServerSupabase = ReturnType<typeof requireSupabase>;

async function findProfile(supabase: ServerSupabase, id: string) {
  const { data, error } = await supabase.from('member_profiles').select('*').eq('id', id).maybeSingle();
  if (error) console.error('profile lookup failed:', error.code);
  return data as Record<string, any> | null;
}

export const members = {
  signUp: defineAction({
    input: z.object({ email: z.string(), password: z.string(), fullName: z.string(), phone: z.string() }),
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
          emailRedirectTo: `${context.url.origin}/membros`,
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
      return { needsConfirmation: false, profile: await findProfile(supabase, data.user.id) };
    },
  }),

  login: defineAction({
    input: z.object({ email: z.string(), password: z.string() }),
    handler: async (body) => {
      const { data: input, error: invalid } = parseCredentials(body);
      if (!input) throw badRequest(invalid!);
      const supabase = requireSupabase();

      const { data, error } = await supabase.auth.signInWithPassword(input);
      if (error || !data.user) {
        throw new ActionError({ code: 'UNAUTHORIZED', message: 'E-mail ou senha incorretos.' });
      }
      return { profile: await findProfile(supabase, data.user.id) };
    },
  }),

};
