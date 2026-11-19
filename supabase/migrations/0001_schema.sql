-- =====================================================================
-- Anemone Magic Reading — schema
-- Ownership model: a PARENT (auth.users) owns CHILD profiles; every
-- learning record hangs off a child. Content tables are read-only to clients.
-- =====================================================================


-- ---------- Children (owned by a parent account) ----------
create table public.children (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nickname    text not null check (char_length(btrim(nickname)) between 1 and 20),
  avatar      text not null default '🐙' check (char_length(avatar) <= 16),
  created_at  timestamptz not null default now()
);
create index children_parent_idx on public.children (parent_id);

-- ---------- Curriculum (content) ----------
create table public.learning_modules (
  id               text primary key,              -- e.g. 'm1'
  title            text not null,
  subtitle         text,
  description      text,
  emoji            text,
  color            text check (color in ('sea','lagoon','coral','sun','lilac')),
  sequence_order   int  not null,
  difficulty_level int  not null default 1,
  is_active        boolean not null default true,
  assumption_note  text                            -- pedagogical assumption awaiting review
);

create table public.lessons (
  id              text primary key,               -- e.g. 'm1-l1'
  module_id       text not null references public.learning_modules (id) on delete cascade,
  title           text not null,
  instructions    text not null,                  -- spoken to the child
  content_type    text not null check (content_type in
                    ('sound_story','listen_choose','match','syllable_build','word_explore','read_discover','treasure_quiz')),
  sequence_order  int  not null,
  audio_url       text,                           -- optional recorded instructions
  is_active       boolean not null default true
);
create index lessons_module_idx on public.lessons (module_id, sequence_order);

create table public.learning_items (
  id              text primary key,               -- e.g. 'm1-l1-i1'
  lesson_id       text not null references public.lessons (id) on delete cascade,
  sequence_order  int  not null,
  kind            text not null check (kind in
                    ('sound_story','listen_choose','match','syllable_build','word_explore','read_discover')),
  question        text,                           -- what is spoken / shown
  answer          text,
  options         jsonb,
  payload         jsonb not null,                 -- full mechanic-specific item (see src/content/types.ts)
  image_url       text,
  audio_url       text                            -- optional recorded voice (Supabase Storage)
);
create index learning_items_lesson_idx on public.learning_items (lesson_id, sequence_order);

-- ---------- Learning records (per child) ----------
create table public.child_progress (
  id                 uuid primary key default gen_random_uuid(),
  child_id           uuid not null references public.children (id) on delete cascade,
  lesson_id          text not null references public.lessons (id) on delete cascade,
  completion_status  text not null default 'in_progress' check (completion_status in ('in_progress','completed')),
  score              int  not null default 0 check (score between 0 and 3),  -- best stars
  attempts           int  not null default 0,
  correct_answers    int  not null default 0,
  incorrect_answers  int  not null default 0,
  duration_seconds   int  not null default 0,
  last_played_at     timestamptz not null default now(),
  completed_at       timestamptz,
  unique (child_id, lesson_id)
);

create table public.lesson_attempts (
  id                 uuid primary key default gen_random_uuid(),
  child_id           uuid not null references public.children (id) on delete cascade,
  lesson_id          text not null references public.lessons (id) on delete cascade,
  stars              int  not null check (stars between 0 and 3),
  correct_answers    int  not null default 0,
  incorrect_answers  int  not null default 0,
  duration_seconds   int  not null default 0,
  created_at         timestamptz not null default now()
);
create index lesson_attempts_child_idx on public.lesson_attempts (child_id, created_at desc);

create table public.item_results (
  id                 uuid primary key default gen_random_uuid(),
  child_id           uuid not null references public.children (id) on delete cascade,
  lesson_id          text not null references public.lessons (id) on delete cascade,
  item_id            text not null,
  item_label         text not null,
  correct_first_try  boolean not null,
  attempts           int  not null default 1,
  created_at         timestamptz not null default now()
);
create index item_results_child_idx on public.item_results (child_id, created_at desc);

create table public.rewards (
  id            uuid primary key default gen_random_uuid(),
  child_id      uuid not null references public.children (id) on delete cascade,
  reward_type   text not null check (reward_type in ('xp','badge','chest','daily')),
  reward_value  text not null,
  amount        int  not null default 1 check (amount between 0 and 1000),
  earned_at     timestamptz not null default now()
);
create index rewards_child_idx on public.rewards (child_id);
-- one daily gift per day, one of each badge, one chest per island
create unique index rewards_once_idx on public.rewards (child_id, reward_type, reward_value)
  where reward_type in ('badge','chest','daily');

create table public.learning_sessions (
  id              uuid primary key default gen_random_uuid(),
  child_id        uuid not null references public.children (id) on delete cascade,
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  total_duration  int not null default 0 check (total_duration >= 0)
);
create index learning_sessions_child_idx on public.learning_sessions (child_id, started_at desc);
