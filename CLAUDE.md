# Project conventions

## Language

- The whole project is written in **English**: database (tables, columns, functions, triggers, policies, migration file names), code identifiers (variables, functions, types, components, files), comments, commit messages and documentation.
- Only user-facing copy shown on the site stays in Brazilian Portuguese (pt-BR), since the audience is Brazilian.
- Existing Portuguese identifiers (e.g. in `src/lib/membros-data.ts`, `PortalMembros.tsx`) are legacy; rename them to English when touching that code.

## Database

- Supabase migrations live in `supabase/migrations/`, named `<timestamp>_<snake_case_english_description>.sql`.
- Every Supabase interaction goes through Astro Actions (`src/actions/`: one file per domain, aggregated in `index.ts`). Islands never import `@supabase/supabase-js`. The secret key bypasses RLS, so each action must validate its input and scope its queries.
- Every volunteer is a member; not every member is a volunteer. `volunteers` is keyed by `member_id` (FK to `member_profiles`, one record per member) and holds only volunteer data (areas, guidance, consent). Name, e-mail, phone and birth date live in `member_profiles`, never duplicated. Volunteer actions require a signed-in member (session cookies in `src/lib/server/session.ts`).
- `volunteers.serving_status` is `pending` | `serving` | `inactive`; only the leadership changes it.
- Volunteer areas live in the `volunteer_areas` table (edit rows there, not in code). Categories and icons stay in code, so new values need a code change.
