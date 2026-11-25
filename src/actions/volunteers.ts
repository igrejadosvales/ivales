import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { badRequest, requireSupabase } from '../lib/server/action-helpers';
import { AREAS, validarAreas, validarConsentimento, validarDados } from '../lib/voluntariado';

export const volunteers = {
  create: defineAction({
    input: z.object({
      fullName: z.string().max(150),
      email: z.string().max(254),
      phone: z.string().max(20),
      birthDate: z.string().max(10),
      areaIds: z.array(z.string()).max(AREAS.length),
      wantsGuidance: z.boolean(),
      contactConsent: z.boolean(),
    }),
    handler: async (input) => {
      const errors = {
        ...validarDados({
          nome: input.fullName,
          email: input.email,
          telefone: input.phone,
          nascimento: input.birthDate,
        }),
        ...validarAreas(input.areaIds, input.wantsGuidance),
        ...validarConsentimento(input.contactConsent),
      };
      const firstError = Object.values(errors)[0];
      if (firstError) throw badRequest(firstError);
      if (input.areaIds.some((id) => !AREAS.some((area) => area.id === id))) {
        throw badRequest('Área de voluntariado inválida.');
      }

      const { error } = await requireSupabase().rpc('create_volunteer', {
        p_full_name: input.fullName,
        p_email: input.email,
        p_phone: input.phone,
        p_birth_date: input.birthDate,
        // Kept for compatibility with the current RPC; the field is no longer shown.
        p_education_level: null,
        p_area_ids: input.areaIds,
        p_wants_guidance: input.wantsGuidance,
        p_contact_consent: input.contactConsent,
      });
      if (error) {
        console.error('create_volunteer failed:', error.code);
        throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível salvar seu cadastro.' });
      }
      return { ok: true };
    },
  }),
};
