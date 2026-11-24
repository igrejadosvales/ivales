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
