// Every Supabase interaction goes through these actions, one file per domain. They run on the
// server only. The secret key bypasses RLS, so each action must validate its input.
import { members } from './members';
import { volunteers } from './volunteers';

export const server = { members, volunteers };
