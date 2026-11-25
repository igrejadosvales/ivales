import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { badRequest, requireSupabase } from '../lib/server/action-helpers';
import { currentMemberId, saveSession } from '../lib/server/session';
import { parseSignUp } from '../lib/member-auth';
import { validarAreas, validarConsentimento, validarDados, type AreaVoluntariado } from '../lib/voluntariado';

// Every volunteer is a member. A signed-in member signs up with their own account; someone without
// an account creates one in the same step (`account`). Either way the volunteer record is keyed by
// the member id, and name/e-mail live only in the member profile.
const notSignedIn = () =>
  new ActionError({ code: 'UNAUTHORIZED', message: 'Entre com sua conta de membro para se cadastrar como voluntário.' });

const emailTaken = () =>
  new ActionError({
    code: 'CONFLICT',
    message: 'Este e-mail já tem uma conta de membro. Entre com ela para continuar.',
  });

// Active areas, in display order, in the shape the form uses.
async function listAreas(): Promise<AreaVoluntariado[]> {
  const { data, error } = await requireSupabase()
    .from('volunteer_areas')
    .select('id, name, description, category, icon, skills, commitment')
    .eq('active', true)
    .order('position');
  if (error) {
    console.error('area list failed:', error.code);
    throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível carregar as áreas.' });
  }
  return data.map((row) => ({
    id: row.id,
    nome: row.name,
    descricao: row.description,
    categoria: row.category,
    icone: row.icon,
    habilidades: row.skills,
    compromisso: row.commitment,
  }));
}

export const volunteers = {
  areas: defineAction({ handler: () => listAreas() }),

  // The signed-in member's volunteer record (null when they are not a volunteer yet).
  mine: defineAction({
    handler: async (_input, context) => {
      const memberId = await currentMemberId(context.cookies);
      if (!memberId) throw notSignedIn();
      const { data, error } = await requireSupabase()
        .from('volunteers')
        .select('area_ids, wants_guidance, serving_status')
        .eq('member_id', memberId)
        .maybeSingle();
      if (error) console.error('volunteer lookup failed:', error.code);
      return { volunteer: data ?? null };
    },
  }),

  create: defineAction({
    input: z.object({
      phone: z.string().max(20),
      birthDate: z.string().max(10),
      areaIds: z.array(z.string().max(60)).max(50),
      wantsGuidance: z.boolean(),
      contactConsent: z.boolean(),
      // Only when nobody is signed in: creates the member account in the same submission.
      account: z.object({ fullName: z.string(), email: z.string(), password: z.string() }).optional(),
    }),
    handler: async (input, context) => {
      const supabase = requireSupabase();
      let memberId = await currentMemberId(context.cookies);
      let needsConfirmation = false;

      if (!memberId) {
        if (!input.account) throw notSignedIn();
        const { data: signUp, error: invalid } = parseSignUp({ ...input.account, phone: input.phone });
        if (!signUp) throw badRequest(invalid!);

        const { data, error } = await supabase.auth.signUp({
          email: signUp.email,
          password: signUp.password,
          options: {
            data: { full_name: signUp.fullName, phone: signUp.phone },
            emailRedirectTo: `${context.url.origin}/membros`,
          },
        });
        if (error) {
          if (/already|registered|exists/i.test(error.message)) throw emailTaken();
          console.error('volunteer sign-up failed:', error.status, error.code);
          throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível criar sua conta.' });
        }
        // With e-mail confirmation on, Supabase hides existing accounts: no error, but no identities.
        if (!data.user || data.user.identities?.length === 0) throw emailTaken();

        memberId = data.user.id;
        if (data.session) saveSession(context.cookies, data.session);
        else needsConfirmation = true;
      }

      const { data: profile, error: profileError } = await supabase
        .from('member_profiles')
        .select('full_name, email')
        .eq('id', memberId)
        .maybeSingle();
      if (profileError || !profile) {
        console.error('profile lookup failed:', profileError?.code);
        throw notSignedIn();
      }

      const errors = {
        ...validarDados({
          nome: profile.full_name,
          email: profile.email,
          telefone: input.phone,
          nascimento: input.birthDate,
        }),
        ...validarAreas(input.areaIds, input.wantsGuidance),
        ...validarConsentimento(input.contactConsent),
      };
      const firstError = Object.values(errors)[0];
      if (firstError) throw badRequest(firstError);
      const available = await listAreas();
      if (input.areaIds.some((id) => !available.some((area) => area.id === id))) {
        throw badRequest('Área de voluntariado inválida.');
      }

      // Phone and birth date belong to the member profile.
      const { error: updateError } = await supabase
        .from('member_profiles')
        .update({ phone: input.phone.trim(), birth_date: input.birthDate })
        .eq('id', memberId);
      if (updateError) {
        console.error('profile update failed:', updateError.code);
        throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível salvar seu cadastro.' });
      }

      // One record per member: signing up again updates the chosen areas. serving_status is left out on
      // purpose: new records default to 'pending' and an existing status is never reset.
      const { data: record, error } = await supabase.from('volunteers').upsert(
        {
          member_id: memberId,
          area_ids: input.areaIds,
          wants_guidance: input.wantsGuidance,
          contact_consent: input.contactConsent,
        },
        { onConflict: 'member_id' },
      ).select('serving_status').single();
      if (error) {
        console.error('volunteer upsert failed:', error.code);
        throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível salvar seu cadastro.' });
      }
      return { ok: true, needsConfirmation, servingStatus: record.serving_status as string };
    },
  }),
};
