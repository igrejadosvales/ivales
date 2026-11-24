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
