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
