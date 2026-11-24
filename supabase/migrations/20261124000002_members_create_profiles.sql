-- Member profile, 1:1 with auth.users (email and password live in Supabase Auth).
create table public.member_profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  full_name      text not null check (char_length(btrim(full_name)) between 2 and 150),
  email          text not null check (position('@' in email) > 1),
  phone          text check (phone is null or char_length(phone) between 8 and 20),
  neighborhood   text,
  campus         text,
  birth_date     date check (birth_date is null or birth_date <= current_date),
  member_since   date not null default current_date,
  water_baptized boolean not null default false,
  baptism_date   date check (baptism_date is null or baptism_date <= current_date),
  interests      text[] not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint baptism_date_requires_baptized check (water_baptized or baptism_date is null)
);

create unique index member_profiles_email_key on public.member_profiles (lower(email));

create trigger member_profiles_set_updated_at
  before update on public.member_profiles
  for each row execute function public.set_updated_at();

comment on table public.member_profiles is 'Member profile created at sign-up (1:1 with auth.users).';
