-- Generic trigger function that keeps updated_at current.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
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
-- Creates the profile automatically when someone signs up via supabase.auth.signUp.
-- The client sends full_name and phone in options.data (raw_user_meta_data).
create or replace function public.handle_new_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.member_profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    new.email,
    nullif(btrim(new.raw_user_meta_data ->> 'phone'), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created_create_member_profile
  after insert on auth.users
  for each row execute function public.handle_new_member();

-- Keeps the profile email in sync when it changes in Auth.
create or replace function public.sync_member_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.member_profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed_sync_member_profile
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.sync_member_email();
-- Each member can read and update only their own profile.
-- Creation is done only by the sign-up trigger; deletion cascades from auth.users.
alter table public.member_profiles enable row level security;

create policy "members read own profile"
  on public.member_profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "members update own profile"
  on public.member_profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Prevent members from changing identity fields through the API.
revoke update on public.member_profiles from authenticated;
grant select on public.member_profiles to authenticated;
grant update (full_name, phone, neighborhood, campus, birth_date, water_baptized, baptism_date, interests)
  on public.member_profiles to authenticated;
-- WhatsApp number is mandatory at sign-up.
-- Safe on the current state: member_profiles is empty. If rows with a null phone exist, fix them first.
alter table public.member_profiles
  alter column phone set not null,
  drop constraint member_profiles_phone_check,
  add constraint member_profiles_phone_check
    check (regexp_replace(phone, '\D', '', 'g') ~ '^[0-9]{10,13}$');

-- Fail sign-up with a clear message when the phone is missing or invalid.
create or replace function public.handle_new_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  member_phone text := nullif(btrim(new.raw_user_meta_data ->> 'phone'), '');
begin
  if member_phone is null or regexp_replace(member_phone, '\D', '', 'g') !~ '^[0-9]{10,13}$' then
    raise exception 'A valid phone (WhatsApp) number is required to sign up';
  end if;

  insert into public.member_profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    new.email,
    member_phone
  );
  return new;
end;
$$;
