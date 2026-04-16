-- Family Events
create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  event_date date not null,
  event_time time,
  colour text not null default '#4ade80',
  created_at timestamptz not null default now()
);

create index on events(household_id, event_date);

alter table events enable row level security;

create policy "members can view events" on events for select
  using (household_id = get_my_household_id());

create policy "members can insert events" on events for insert
  with check (household_id = get_my_household_id() and created_by = auth.uid());

create policy "members can update their events" on events for update
  using (created_by = auth.uid());

create policy "members can delete their events" on events for delete
  using (created_by = auth.uid());

-- Family Photos
create table if not exists photos (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

create index on photos(household_id, created_at desc);

alter table photos enable row level security;

create policy "members can view photos" on photos for select
  using (household_id = get_my_household_id());

create policy "members can insert photos" on photos for insert
  with check (household_id = get_my_household_id() and uploaded_by = auth.uid());

create policy "members can delete their photos" on photos for delete
  using (uploaded_by = auth.uid());

-- Storage bucket for photos (run this separately if needed)
-- insert into storage.buckets (id, name, public) values ('family-photos', 'family-photos', false);
