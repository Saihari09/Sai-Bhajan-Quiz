-- Bhajan Bodh leaderboard schema (run once in the Supabase SQL editor).
-- Identity model: Supabase anonymous sign-in; auth.uid() IS the device id.

create table if not exists players (
  device_id    uuid primary key,
  display_name text not null check (char_length(display_name) between 1 and 20),
  created_at   timestamptz not null default now()
);

create table if not exists scores (
  device_id    uuid not null references players (device_id) on delete cascade,
  date         date not null,
  game         text not null check (char_length(game) <= 20),
  points       int  not null check (points between 0 and 100),
  seconds      int  check (seconds >= 0),
  completed_at timestamptz not null default now(),
  primary key (device_id, date, game)
);
-- Upgrading an existing project: run this line once.
alter table scores add column if not exists seconds int check (seconds >= 0);

create table if not exists groups (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  name       text not null check (char_length(name) between 1 and 30),
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists group_members (
  group_id  uuid not null references groups (id) on delete cascade,
  device_id uuid not null references players (device_id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, device_id)
);

-- Row-level security: every device writes only its own rows; boards read freely.
alter table players       enable row level security;
alter table scores        enable row level security;
alter table groups        enable row level security;
alter table group_members enable row level security;

-- drop-then-create makes the whole file safely re-runnable
drop policy if exists players_select on players;
drop policy if exists players_insert on players;
drop policy if exists players_update on players;
create policy players_select on players for select using (true);
create policy players_insert on players for insert with check (auth.uid() = device_id);
create policy players_update on players for update using (auth.uid() = device_id);

drop policy if exists scores_select on scores;
drop policy if exists scores_insert on scores;
create policy scores_select on scores for select using (true);
create policy scores_insert on scores for insert with check (auth.uid() = device_id);

drop policy if exists groups_select on groups;
drop policy if exists groups_insert on groups;
create policy groups_select on groups for select using (true);
create policy groups_insert on groups for insert with check (auth.uid() = created_by);

drop policy if exists members_select on group_members;
drop policy if exists members_insert on group_members;
drop policy if exists members_delete on group_members;
create policy members_select on group_members for select using (true);
create policy members_insert on group_members for insert with check (auth.uid() = device_id);
create policy members_delete on group_members for delete using (auth.uid() = device_id);

-- Daily totals per player (base points only; per-game rows capped 0–100).
create or replace view daily_totals
with (security_invoker = true) as
  select s.device_id, s.date, sum(s.points)::int as total,
         sum(coalesce(s.seconds, 0))::int as total_seconds, p.display_name
  from scores s
  join players p using (device_id)
  group by s.device_id, s.date, p.display_name;

-- Weekly lamps: distinct days played in the last 7 days — consistency beats speed.
create or replace view weekly_lamps
with (security_invoker = true) as
  select s.device_id, count(distinct s.date)::int as days, p.display_name
  from scores s
  join players p using (device_id)
  where s.date >= current_date - 6
  group by s.device_id, p.display_name;
