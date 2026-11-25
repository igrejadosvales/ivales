// Validation shared by the sign-up and login endpoints.
export const MIN_PASSWORD_LENGTH = 8;

export interface Credentials {
  email: string;
  password: string;
}

export interface SignUpData extends Credentials {
  fullName: string;
  phone: string;
}

type Parsed<T> = { data: T; error?: never } | { data?: never; error: string };

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export function parseCredentials(body: unknown): Parsed<Credentials> {
  const input = (body ?? {}) as Record<string, unknown>;
  const email = text(input.email);
  const password = typeof input.password === 'string' ? input.password : '';
  if (!email.includes('@') || !password) return { error: 'Preencha seu e-mail e sua senha.' };
  return { data: { email, password } };
}

export function parseSignUp(body: unknown): Parsed<SignUpData> {
  const credentials = parseCredentials(body);
  if (!credentials.data) return { error: credentials.error };

  const input = body as Record<string, unknown>;
  const fullName = text(input.fullName);
  const phone = text(input.phone);
  const digits = phone.replace(/\D/g, '');

  if (fullName.length < 2 || fullName.length > 150) return { error: 'Informe seu nome completo.' };
  if (digits.length < 10 || digits.length > 13) return { error: 'Informe um WhatsApp válido, com DDD.' };
  if (credentials.data.password.length < MIN_PASSWORD_LENGTH) {
    return { error: `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` };
  }
  return { data: { ...credentials.data, fullName, phone } };
}
