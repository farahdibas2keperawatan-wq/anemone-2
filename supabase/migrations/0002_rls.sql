-- =====================================================================
-- Row Level Security
--  • Content tables: readable by everyone, writable only via the dashboard /
--    service role (no client write policies exist).
--  • Child data: a parent can only see/modify rows of children they own.
--    One child's records are therefore never visible from another account.
-- =====================================================================

alter table public.children          enable row level security;
alter table public.learning_modules  enable row level security;
alter table public.lessons           enable row level security;
alter table public.learning_items    enable row level security;
alter table public.child_progress    enable row level security;
alter table public.lesson_attempts   enable row level security;
alter table public.item_results      enable row level security;
alter table public.rewards           enable row level security;
alter table public.learning_sessions enable row level security;

-- Helper: does the current user own this child?
create or replace function public.owns_child(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.children c
    where c.id = cid and c.parent_id = (select auth.uid())
  );
$$;
revoke all on function public.owns_child(uuid) from public;
grant execute on function public.owns_child(uuid) to authenticated;

-- ---------- children ----------
create policy "parents read own children"   on public.children for select to authenticated
  using (parent_id = (select auth.uid()));
create policy "parents add own children"    on public.children for insert to authenticated
  with check (parent_id = (select auth.uid()));
create policy "parents update own children" on public.children for update to authenticated
  using (parent_id = (select auth.uid())) with check (parent_id = (select auth.uid()));
create policy "parents delete own children" on public.children for delete to authenticated
  using (parent_id = (select auth.uid()));

-- ---------- content (read-only) ----------
create policy "content readable" on public.learning_modules for select to anon, authenticated using (is_active);
create policy "content readable" on public.lessons          for select to anon, authenticated using (is_active);
create policy "content readable" on public.learning_items   for select to anon, authenticated
  using (exists (select 1 from public.lessons l where l.id = lesson_id and l.is_active));

-- ---------- per-child records ----------
-- progress: read/insert/update (upsert) by owner
create policy "own child progress read"   on public.child_progress for select to authenticated using (public.owns_child(child_id));
create policy "own child progress insert" on public.child_progress for insert to authenticated with check (public.owns_child(child_id));
create policy "own child progress update" on public.child_progress for update to authenticated
  using (public.owns_child(child_id)) with check (public.owns_child(child_id));

-- append-only logs: read + insert
create policy "own attempts read"   on public.lesson_attempts for select to authenticated using (public.owns_child(child_id));
create policy "own attempts insert" on public.lesson_attempts for insert to authenticated with check (public.owns_child(child_id));

create policy "own item results read"   on public.item_results for select to authenticated using (public.owns_child(child_id));
create policy "own item results insert" on public.item_results for insert to authenticated with check (public.owns_child(child_id));

create policy "own rewards read"   on public.rewards for select to authenticated using (public.owns_child(child_id));
create policy "own rewards insert" on public.rewards for insert to authenticated with check (public.owns_child(child_id));

-- sessions: read/insert/update (heartbeat) by owner
create policy "own sessions read"   on public.learning_sessions for select to authenticated using (public.owns_child(child_id));
create policy "own sessions insert" on public.learning_sessions for insert to authenticated with check (public.owns_child(child_id));
create policy "own sessions update" on public.learning_sessions for update to authenticated
  using (public.owns_child(child_id)) with check (public.owns_child(child_id));

-- Explicit grants (Supabase defaults are usually enough; kept for clarity)
grant select on public.learning_modules, public.lessons, public.learning_items to anon, authenticated;
grant select, insert, update, delete on public.children to authenticated;
grant select, insert, update on public.child_progress, public.learning_sessions to authenticated;
grant select, insert on public.lesson_attempts, public.item_results, public.rewards to authenticated;
