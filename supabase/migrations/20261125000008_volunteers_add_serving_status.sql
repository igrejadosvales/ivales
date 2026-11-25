-- Where the volunteer is in the serving journey. New sign-ups wait for the leadership ('pending');
-- change it to 'serving' or 'inactive' in the Table Editor. Existing rows become 'pending'.
alter table public.volunteers
  add column serving_status text not null default 'pending'
    check (serving_status in ('pending', 'serving', 'inactive'));

create index volunteers_serving_status_idx on public.volunteers (serving_status);
