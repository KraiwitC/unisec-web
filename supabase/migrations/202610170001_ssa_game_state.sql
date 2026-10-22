-- Apply in the Supabase SQL Editor or through `supabase db push`.
-- No public database access is necessary: Next.js relays Realtime read-only.
begin;

create table if not exists public.ssa_game_state (
  id integer primary key check (id = 1),
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default clock_timestamp()
);

alter table public.ssa_game_state enable row level security;
revoke all on table public.ssa_game_state from public, anon, authenticated;
grant select, insert, update, delete on table public.ssa_game_state to service_role;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ssa_game_state'
  ) then
    alter publication supabase_realtime add table public.ssa_game_state;
  end if;
end $$;

commit;
