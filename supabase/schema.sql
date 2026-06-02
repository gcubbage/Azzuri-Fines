-- Azzuri Fines — database schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
-- Then run seed.sql to load the fixed 2025 fines list.

-- ── Tables ────────────────────────────────────────────────────────────────

create table if not exists public.players (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.fine_types (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  amount      numeric(8,2) not null,
  sort_order  int not null default 0
);

create table if not exists public.fines (
  id           uuid primary key default gen_random_uuid(),
  player_id    uuid not null references public.players(id) on delete cascade,
  fine_type_id uuid references public.fine_types(id) on delete set null,
  round        text not null,
  -- amount is snapshotted at assign time so editing a fine_type's price later
  -- does not rewrite historical totals.
  amount       numeric(8,2) not null,
  created_at   timestamptz not null default now()
);

create table if not exists public.payments (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references public.players(id) on delete cascade,
  amount     numeric(8,2) not null,
  note       text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists fines_player_id_idx    on public.fines(player_id);
create index if not exists payments_player_id_idx on public.payments(player_id);

-- ── Row Level Security ─────────────────────────────────────────────────────
-- This app is intentionally OPEN (no login). RLS is enabled but policies allow
-- the anon key full read/write. If you later add auth, tighten these policies.

alter table public.players    enable row level security;
alter table public.fine_types enable row level security;
alter table public.fines      enable row level security;
alter table public.payments   enable row level security;

do $$
declare t text;
begin
  foreach t in array array['players','fine_types','fines','payments'] loop
    execute format('drop policy if exists "anon_all" on public.%I;', t);
    execute format(
      'create policy "anon_all" on public.%I for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;
