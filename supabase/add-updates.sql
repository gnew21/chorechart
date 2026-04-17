create table if not exists updates (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  posted_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  created_at timestamptz not null default now()
);

create index on updates(household_id, created_at desc);

alter table updates enable row level security;

create policy "members can view updates" on updates for select
  using (household_id = get_my_household_id());

create policy "admins can insert updates" on updates for insert
  with check (household_id = get_my_household_id());

create policy "admins can delete their updates" on updates for delete
  using (posted_by = auth.uid());
