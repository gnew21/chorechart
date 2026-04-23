-- Group chat messages
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid references auth.users(id) on delete cascade, -- null = group chat
  body text not null,
  created_at timestamptz not null default now()
);

create index on messages(household_id, created_at desc);
create index on messages(household_id, sender_id, recipient_id);

alter table messages enable row level security;

create policy "members can view messages" on messages for select
  using (household_id = get_my_household_id());

create policy "members can send messages" on messages for insert
  with check (household_id = get_my_household_id() and sender_id = auth.uid());

create policy "members can delete their messages" on messages for delete
  using (sender_id = auth.uid());
