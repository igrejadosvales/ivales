// Member session in httpOnly cookies, so server actions know who is calling.
// The access token is short-lived; when it expires the refresh token renews it on the next request.
import type { AstroCookies } from 'astro';
import type { Session } from '@supabase/supabase-js';
import { requireSupabase } from './action-helpers';

const ACCESS_COOKIE = 'ivales-access-token';
const REFRESH_COOKIE = 'ivales-refresh-token';
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: import.meta.env.PROD,
  sameSite: 'lax' as const,
  path: '/',
  maxAge,
});

export function saveSession(cookies: AstroCookies, session: Session) {
  cookies.set(ACCESS_COOKIE, session.access_token, cookieOptions(session.expires_in));
  cookies.set(REFRESH_COOKIE, session.refresh_token, cookieOptions(REFRESH_MAX_AGE));
}

export function clearSession(cookies: AstroCookies) {
  cookies.delete(ACCESS_COOKIE, { path: '/' });
  cookies.delete(REFRESH_COOKIE, { path: '/' });
}

/** Id of the signed-in member, or null. Renews an expired access token when possible. */
export async function currentMemberId(cookies: AstroCookies): Promise<string | null> {
  const supabase = requireSupabase();
  const accessToken = cookies.get(ACCESS_COOKIE)?.value;
  if (accessToken) {
    const { data } = await supabase.auth.getUser(accessToken);
    if (data.user) return data.user.id;
  }

  const refreshToken = cookies.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    const { data } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (data.session && data.user) {
      saveSession(cookies, data.session);
      return data.user.id;
    }
  }

  clearSession(cookies);
  return null;
}
