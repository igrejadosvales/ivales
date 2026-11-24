# Project conventions

## Language

- The whole project is written in **English**: database (tables, columns, functions, triggers, policies, migration file names), code identifiers (variables, functions, types, components, files), comments, commit messages and documentation.
- Only user-facing copy shown on the site stays in Brazilian Portuguese (pt-BR), since the audience is Brazilian.
- Existing Portuguese identifiers (e.g. in `src/lib/membros-data.ts`, `PortalMembros.tsx`) are legacy; rename them to English when touching that code.

## Database

- Supabase migrations live in `supabase/migrations/`, named `<timestamp>_<snake_case_english_description>.sql`.
