-- Volunteers. Every volunteer is a member; not every member is a volunteer.
-- member_id is the primary key: at most one volunteer record per member, removed with the member.
-- Name, e-mail, phone and birth date live in member_profiles, never duplicated here.
create table public.volunteers (
  member_id       uuid primary key references public.member_profiles (id) on delete cascade,
  area_ids        text[] not null default '{}',
  wants_guidance  boolean not null default false,
  contact_consent boolean not null check (contact_consent),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint volunteers_area_or_guidance check (cardinality(area_ids) > 0 or wants_guidance)
);

create index volunteers_created_at_idx on public.volunteers (created_at desc);

create trigger volunteers_set_updated_at
  before update on public.volunteers
  for each row execute function public.set_updated_at();

-- Server only: RLS with no policy and no grants, so the API never exposes this table to visitors
-- or members directly. Astro Actions (secret key) read and write it after checking the session.
alter table public.volunteers enable row level security;
revoke all on public.volunteers from anon, authenticated;

comment on table public.volunteers is 'Volunteer record of a member (1:0..1 with member_profiles).';
