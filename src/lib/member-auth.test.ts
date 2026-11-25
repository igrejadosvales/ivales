import { describe, expect, it } from 'vitest';
import { parseCredentials, parseSignUp } from './member-auth';

const valid = { fullName: 'Maria Silva', email: 'maria@example.com', phone: '(51) 99999-0000', password: '12345678' };

describe('member auth validation', () => {
  it('accepts a complete sign-up', () => {
    expect(parseSignUp(valid).data).toEqual(valid);
  });

  it.each([
    ['name', { fullName: '' }],
    ['email', { email: 'maria' }],
    ['missing phone', { phone: '' }],
    ['short phone', { phone: '999' }],
    ['short password', { password: '1234567' }],
  ])('rejects invalid %s', (_label, change) => {
    expect(parseSignUp({ ...valid, ...change }).error).toBeTruthy();
  });

  it('rejects an empty body', () => {
    expect(parseCredentials(null).error).toBeTruthy();
    expect(parseSignUp(undefined).error).toBeTruthy();
  });
});
