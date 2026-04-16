-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enums
create type plan_type as enum ('free', 'family', 'family_plus');
create type role_type as enum ('admin', 'member');
create type time_of_day_type as enum ('morning', 'afternoon', 'evening');
create type log_method_type as enum ('manual', 'qr', 'ai_vision');

-- Households
create table households (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  join_code text not null unique,
  plan plan_type not null default 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);

-- Household members
create table household_members (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_colour text not null default '#a8d5a2',
  role role_type not null default 'member',
  push_token text,
  created_at timestamptz not null default now(),
  unique(household_id, user_id)
);

-- Chores
create table chores (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  emoji text not null default '✅',
  points int not null default 10 check (points > 0),
  time_of_day time_of_day_type,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Chore logs
create table chore_logs (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  chore_id uuid not null references chores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  points_earned int not null default 0,
  time_of_day time_of_day_type not null,
  method log_method_type not null default 'manual',
  photo_url text,
  logged_at timestamptz not null default now()
);

-- Point rules (one row per household)
create table point_rules (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade unique,
  weekend_multiplier numeric not null default 1.5,
  streak_bonus_per_day int not null default 2,
  early_bird_bonus int not null default 5
);

-- Weekly prizes
create table prizes (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  week_start date not null,
  description text not null,
  created_at timestamptz not null default now(),
  unique(household_id, week_start)
);

-- Push subscriptions
create table push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index on chore_logs(household_id, logged_at desc);
create index on chore_logs(user_id, logged_at desc);
create index on household_members(user_id);

-- Row Level Security
alter table households enable row level security;
alter table household_members enable row level security;
alter table chores enable row level security;
alter table chore_logs enable row level security;
alter table point_rules enable row level security;
alter table prizes enable row level security;
alter table push_subscriptions enable row level security;

-- Households: members can read, admins can update
create policy "members can view their household"
  on households for select
  using (id in (select household_id from household_members where user_id = auth.uid()));

create policy "admins can update household"
  on households for update
  using (id in (select household_id from household_members where user_id = auth.uid() and role = 'admin'));

create policy "anyone can insert household"
  on households for insert
  with check (true);

-- Household members
create policy "members can view household members"
  on household_members for select
  using (household_id in (select household_id from household_members where user_id = auth.uid()));

create policy "users can insert themselves"
  on household_members for insert
  with check (user_id = auth.uid());

create policy "admins can update members"
  on household_members for update
  using (household_id in (select household_id from household_members where user_id = auth.uid() and role = 'admin') or user_id = auth.uid());

create policy "admins can delete members"
  on household_members for delete
  using (household_id in (select household_id from household_members where user_id = auth.uid() and role = 'admin'));

-- Chores
create policy "members can view chores"
  on chores for select
  using (household_id in (select household_id from household_members where user_id = auth.uid()));

create policy "admins can manage chores"
  on chores for all
  using (household_id in (select household_id from household_members where user_id = auth.uid() and role = 'admin'));

-- Chore logs
create policy "members can view chore logs"
  on chore_logs for select
  using (household_id in (select household_id from household_members where user_id = auth.uid()));

create policy "members can insert their own logs"
  on chore_logs for insert
  with check (
    user_id = auth.uid()
    and household_id in (select household_id from household_members where user_id = auth.uid())
  );

-- Point rules
create policy "members can view point rules"
  on point_rules for select
  using (household_id in (select household_id from household_members where user_id = auth.uid()));

create policy "admins can manage point rules"
  on point_rules for all
  using (household_id in (select household_id from household_members where user_id = auth.uid() and role = 'admin'));

-- Prizes
create policy "members can view prizes"
  on prizes for select
  using (household_id in (select household_id from household_members where user_id = auth.uid()));

create policy "admins can manage prizes"
  on prizes for all
  using (household_id in (select household_id from household_members where user_id = auth.uid() and role = 'admin'));

-- Push subscriptions
create policy "users can manage their own push subscriptions"
  on push_subscriptions for all
  using (user_id = auth.uid());
