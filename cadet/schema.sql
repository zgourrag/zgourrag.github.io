-- Run once in the Supabase SQL editor. Zero-auth: everyone uses the public anon key.
create table public.cadets (
  handle        text primary key check (handle ~ '^[A-Za-z0-9_-]{2,20}$'),
  campus        text not null default '1337 Khouribga' check (char_length(campus) <= 30),
  avatar_sprite text not null default 'cadet_01' check (char_length(avatar_sprite) <= 30),
  created_at    timestamptz not null default now()
);

create table public.leaderboards (
  id            bigint generated always as identity primary key,
  handle        text not null references public.cadets(handle) on delete cascade,
  dungeon_name  text not null check (char_length(dungeon_name) <= 40),
  clear_time_ms integer not null check (clear_time_ms between 15000 and 86400000),
  score         integer not null check (score between 0 and 100000),
  "timestamp"   timestamptz not null default now()
);
create index on public.leaderboards (dungeon_name, clear_time_ms);

create table public.global_wall (
  id          bigint generated always as identity primary key,
  handle      text not null references public.cadets(handle) on delete cascade,
  message     text not null check (char_length(message) between 1 and 140),
  x_pos       real not null check (x_pos between 0 and 100),
  y_pos       real not null check (y_pos between 0 and 100),
  color_hex   text not null check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  "timestamp" timestamptz not null default now()
);
create index on public.global_wall ("timestamp" desc);

-- Row Level Security: anyone can read and add rows; nobody can edit or delete from the browser.
alter table public.cadets       enable row level security;
alter table public.leaderboards enable row level security;
alter table public.global_wall  enable row level security;

create policy "read cadets"  on public.cadets       for select to anon using (true);
create policy "add cadets"   on public.cadets       for insert to anon with check (true);
create policy "read scores"  on public.leaderboards for select to anon using (true);
create policy "add scores"   on public.leaderboards for insert to anon with check (true);
create policy "read wall"    on public.global_wall  for select to anon using (true);
create policy "add notes"    on public.global_wall  for insert to anon with check (true);

-- Real-time: broadcast new rows over WebSockets.
alter publication supabase_realtime add table public.leaderboards, public.global_wall, public.cadets;
