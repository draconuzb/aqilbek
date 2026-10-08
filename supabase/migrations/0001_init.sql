-- Aqilbek.uz — initial schema
-- Run in Supabase SQL editor or via `supabase db push`.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '' check (char_length(first_name) <= 60),
  email text,
  grade smallint check (grade between 1 and 11),
  preferred_language text not null default 'auto'
    check (preferred_language in ('auto', 'uz', 'ru', 'en')),
  purposes text[] not null default '{}',
  role text not null default 'student' check (role in ('student', 'admin')),
  onboarded boolean not null default false,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id smallserial primary key,
  name text not null,
  slug text not null unique,
  description text not null default '',
  icon text not null default '📘',
  topics text[] not null default '{}',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_subjects (
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject_id smallint not null references public.subjects (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, subject_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Yangi suhbat' check (char_length(title) <= 120),
  subject_id smallint references public.subjects (id) on delete set null,
  mode text not null default 'explain'
    check (mode in ('explain', 'summary', 'homework', 'general')),
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) <= 40000),
  flagged boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject_id smallint references public.subjects (id) on delete set null,
  title text not null check (char_length(title) <= 200),
  topic text not null check (char_length(topic) <= 200),
  grade smallint check (grade between 1 and 11),
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  quiz_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  score int not null check (score >= 0),
  total int not null check (total > 0),
  answers_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('explanation', 'question', 'note')),
  title text not null check (char_length(title) <= 200),
  content text not null check (char_length(content) <= 40000),
  conversation_id uuid references public.conversations (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Minimal AI usage / safety metadata. Never stores prompt or response text.
create table if not exists public.ai_usage (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('chat', 'quiz', 'practice')),
  status text not null check (status in ('ok', 'blocked', 'error')),
  model text,
  prompt_tokens int,
  completion_tokens int,
  safety_category text,
  created_at timestamptz not null default now()
);

-- Singleton row with runtime settings editable from /admin/settings.
create table if not exists public.app_settings (
  id smallint primary key default 1 check (id = 1),
  ai_enabled boolean not null default true,
  daily_chat_limit int check (daily_chat_limit is null or daily_chat_limit >= 0),
  daily_generation_limit int check (daily_generation_limit is null or daily_generation_limit >= 0),
  announcement text check (announcement is null or char_length(announcement) <= 300),
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists conversations_user_updated_idx on public.conversations (user_id, updated_at desc);
create index if not exists messages_conversation_created_idx on public.messages (conversation_id, created_at);
create index if not exists messages_user_idx on public.messages (user_id);
create index if not exists quizzes_user_created_idx on public.quizzes (user_id, created_at desc);
create index if not exists quiz_attempts_user_created_idx on public.quiz_attempts (user_id, created_at desc);
create index if not exists quiz_attempts_quiz_idx on public.quiz_attempts (quiz_id);
create index if not exists saved_items_user_created_idx on public.saved_items (user_id, created_at desc);
create index if not exists ai_usage_user_kind_created_idx on public.ai_usage (user_id, kind, created_at desc);
create index if not exists ai_usage_created_idx on public.ai_usage (created_at desc);
create index if not exists ai_usage_status_idx on public.ai_usage (status) where status <> 'ok';

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists conversations_updated_at on public.conversations;
create trigger conversations_updated_at before update on public.conversations
  for each row execute function public.set_updated_at();

drop trigger if exists app_settings_updated_at on public.app_settings;
create trigger app_settings_updated_at before update on public.app_settings
  for each row execute function public.set_updated_at();

-- A new message bumps its conversation to the top of the history list.
create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation after insert on public.messages
  for each row execute function public.touch_conversation();

-- Create a profile (and the main subject from the registration form) for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_grade smallint;
  v_subject smallint;
begin
  begin
    v_grade := nullif(meta ->> 'grade', '')::smallint;
    if v_grade not between 1 and 11 then v_grade := null; end if;
  exception when others then
    v_grade := null;
  end;

  insert into public.profiles (id, first_name, email, grade)
  values (
    new.id,
    left(coalesce(nullif(meta ->> 'first_name', ''), meta ->> 'full_name', meta ->> 'name', ''), 60),
    new.email,
    v_grade
  )
  on conflict (id) do nothing;

  select id into v_subject from public.subjects where slug = meta ->> 'main_subject';
  if v_subject is not null then
    insert into public.user_subjects (user_id, subject_id) values (new.id, v_subject)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Authorization helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.user_subjects enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.saved_items enable row level security;
alter table public.ai_usage enable row level security;
alter table public.app_settings enable row level security;

-- profiles
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles
  for insert to authenticated
  with check (id = auth.uid() and role = 'student' and is_blocked = false);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Students may only change these columns; role / is_blocked are admin-only (see admin_update_user).
revoke update on public.profiles from authenticated, anon;
grant update (first_name, grade, preferred_language, purposes, onboarded) on public.profiles to authenticated;

-- subjects: readable by everyone, writable by admins
drop policy if exists "subjects: read" on public.subjects;
create policy "subjects: read" on public.subjects
  for select to anon, authenticated using (is_active or public.is_admin());

drop policy if exists "subjects: admin write" on public.subjects;
create policy "subjects: admin write" on public.subjects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- user_subjects
drop policy if exists "user_subjects: own" on public.user_subjects;
create policy "user_subjects: own" on public.user_subjects
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- conversations
drop policy if exists "conversations: own" on public.conversations;
create policy "conversations: own" on public.conversations
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- messages
drop policy if exists "messages: read own" on public.messages;
create policy "messages: read own" on public.messages
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "messages: insert own" on public.messages;
create policy "messages: insert own" on public.messages
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );

drop policy if exists "messages: delete own" on public.messages;
create policy "messages: delete own" on public.messages
  for delete to authenticated using (user_id = auth.uid());

-- quizzes (admins may review / remove quizzes for quality control)
drop policy if exists "quizzes: read" on public.quizzes;
create policy "quizzes: read" on public.quizzes
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "quizzes: insert own" on public.quizzes;
create policy "quizzes: insert own" on public.quizzes
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "quizzes: delete" on public.quizzes;
create policy "quizzes: delete" on public.quizzes
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- quiz_attempts
drop policy if exists "quiz_attempts: read own" on public.quiz_attempts;
create policy "quiz_attempts: read own" on public.quiz_attempts
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "quiz_attempts: insert own" on public.quiz_attempts;
create policy "quiz_attempts: insert own" on public.quiz_attempts
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.quizzes q where q.id = quiz_id and q.user_id = auth.uid())
  );

-- saved_items
drop policy if exists "saved_items: own" on public.saved_items;
create policy "saved_items: own" on public.saved_items
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ai_usage: append-only for students (no update/delete, so limits cannot be reset)
drop policy if exists "ai_usage: read" on public.ai_usage;
create policy "ai_usage: read" on public.ai_usage
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "ai_usage: insert own" on public.ai_usage;
create policy "ai_usage: insert own" on public.ai_usage
  for insert to authenticated with check (user_id = auth.uid());

-- app_settings
drop policy if exists "app_settings: read" on public.app_settings;
create policy "app_settings: read" on public.app_settings
  for select to authenticated using (true);

drop policy if exists "app_settings: admin update" on public.app_settings;
create policy "app_settings: admin update" on public.app_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Explicit Data API grants (newer Supabase projects no longer grant these automatically).
grant usage on schema public to anon, authenticated;
grant select on public.subjects to anon;
grant select, insert, update, delete on public.subjects, public.user_subjects, public.conversations,
  public.messages, public.quizzes, public.quiz_attempts, public.saved_items to authenticated;
grant select, insert on public.profiles, public.ai_usage to authenticated;
grant select, update on public.app_settings to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ---------------------------------------------------------------------------
-- Admin RPCs (security definer, each checks is_admin()).
-- They return aggregates only, so admins never read students' private chats.
-- ---------------------------------------------------------------------------

create or replace function public.admin_stats()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return json_build_object(
    'total_users', (select count(*) from public.profiles),
    'active_users_7d', (select count(distinct user_id) from public.ai_usage where created_at > now() - interval '7 days'),
    'active_users_today', (select count(distinct user_id) from public.ai_usage where created_at > now() - interval '1 day'),
    'total_conversations', (select count(*) from public.conversations),
    'total_messages', (select count(*) from public.messages),
    'total_ai_requests', (select count(*) from public.ai_usage),
    'total_quizzes', (select count(*) from public.quizzes),
    'total_attempts', (select count(*) from public.quiz_attempts),
    'blocked_requests', (select count(*) from public.ai_usage where status = 'blocked'),
    'failed_requests', (select count(*) from public.ai_usage where status = 'error'),
    'total_tokens', (select coalesce(sum(coalesce(prompt_tokens, 0) + coalesce(completion_tokens, 0)), 0) from public.ai_usage)
  );
end;
$$;

create or replace function public.admin_daily_usage(days int default 14)
returns table (day date, chat bigint, quiz bigint, practice bigint, blocked bigint, users bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    d::date as day,
    count(u.id) filter (where u.kind = 'chat' and u.status = 'ok') as chat,
    count(u.id) filter (where u.kind = 'quiz' and u.status = 'ok') as quiz,
    count(u.id) filter (where u.kind = 'practice' and u.status = 'ok') as practice,
    count(u.id) filter (where u.status = 'blocked') as blocked,
    count(distinct u.user_id) as users
  from generate_series(current_date - (greatest(least(days, 90), 1) - 1), current_date, interval '1 day') d
  left join public.ai_usage u on u.created_at::date = d::date
  group by d
  order by d;
end;
$$;

create or replace function public.admin_users(search text default null, max_rows int default 50)
returns table (
  id uuid, first_name text, email text, grade smallint, role text, is_blocked boolean,
  created_at timestamptz, conversations bigint, ai_requests bigint, last_active timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select p.id, p.first_name, p.email, p.grade, p.role, p.is_blocked, p.created_at,
    (select count(*) from public.conversations c where c.user_id = p.id),
    (select count(*) from public.ai_usage a where a.user_id = p.id),
    (select max(a.created_at) from public.ai_usage a where a.user_id = p.id)
  from public.profiles p
  where search is null or search = ''
    or p.first_name ilike '%' || search || '%'
    or p.email ilike '%' || search || '%'
  order by p.created_at desc
  limit least(greatest(max_rows, 1), 200);
end;
$$;

create or replace function public.admin_update_user(target uuid, new_role text default null, blocked boolean default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if target = auth.uid() then
    raise exception 'cannot modify own admin account' using errcode = '42501';
  end if;
  if new_role is not null and new_role not in ('student', 'admin') then
    raise exception 'invalid role';
  end if;

  update public.profiles
  set role = coalesce(new_role, role),
      is_blocked = coalesce(blocked, is_blocked)
  where id = target;
end;
$$;

revoke execute on function public.admin_stats() from anon;
revoke execute on function public.admin_daily_usage(int) from anon;
revoke execute on function public.admin_users(text, int) from anon;
revoke execute on function public.admin_update_user(uuid, text, boolean) from anon;

-- ---------------------------------------------------------------------------
-- Seed: subjects
-- ---------------------------------------------------------------------------

insert into public.subjects (name, slug, description, icon, topics, sort_order) values
  ('Matematika', 'matematika', 'Sonlar, tenglamalar, geometriya va mantiqiy fikrlash.', '📐',
    array['Kasrlar', 'Foizlar', 'Chiziqli tenglamalar', 'Kvadrat tenglama', 'Tengsizliklar', 'Pifagor teoremasi', 'Funksiyalar', 'Uchburchaklar', 'Darajalar va ildizlar', 'Ehtimollik asoslari'], 1),
  ('Fizika', 'fizika', 'Harakat, kuch, energiya va tabiat qonunlari.', '⚛️',
    array['Mexanik harakat', 'Nyuton qonunlari', 'Ish va energiya', 'Bosim', 'Issiqlik hodisalari', 'Elektr toki', 'Om qonuni', 'Yorug''lik', 'Tovush', 'Magnit maydoni'], 2),
  ('Kimyo', 'kimyo', 'Moddalar, reaksiyalar va ularning xossalari.', '🧪',
    array['Atom tuzilishi', 'Davriy jadval', 'Kimyoviy bog''lanish', 'Valentlik', 'Kimyoviy reaksiyalar', 'Kislotalar va asoslar', 'Tuzlar', 'Mol tushunchasi', 'Eritmalar', 'Organik kimyo asoslari'], 3),
  ('Biologiya', 'biologiya', 'Tirik organizmlar, hujayra va tabiat.', '🧬',
    array['Hujayra tuzilishi', 'Fotosintez', 'Nafas olish', 'Genetika asoslari', 'Evolyutsiya', 'Inson anatomiyasi', 'Ekotizimlar', 'O''simliklar', 'Hayvonlar olami', 'Mikroorganizmlar'], 4),
  ('Informatika', 'informatika', 'Algoritmlar, dasturlash va kompyuter savodxonligi.', '💻',
    array['Algoritm tushunchasi', 'Sanoq sistemalari', 'Python asoslari', 'O''zgaruvchilar va turlar', 'Shart operatorlari', 'Sikllar', 'Massivlar va ro''yxatlar', 'Internet va xavfsizlik', 'Mantiqiy amallar', 'Kompyuter qurilmalari'], 5),
  ('Ona tili', 'ona-tili', 'Grammatika, imlo va nutq madaniyati.', '📖',
    array['Fonetika', 'Imlo qoidalari', 'So''z turkumlari', 'Ot', 'Fe''l', 'Sifat', 'Gap bo''laklari', 'Qo''shma gaplar', 'Tinish belgilari', 'Uslubshunoslik'], 6),
  ('Adabiyot', 'adabiyot', 'Asarlar tahlili, ijodkorlar va badiiy tafakkur.', '📚',
    array['Alisher Navoiy ijodi', 'Abdulla Qodiriy', 'Xalq og''zaki ijodi', 'She''r tahlili', 'Badiiy tasvir vositalari', 'Doston janri', 'Hikoya va qissa', 'Jahon adabiyoti', 'Adabiy turlar', 'Esse yozish'], 7),
  ('Tarix', 'tarix', 'O''zbekiston va jahon tarixi voqealari.', '🏛️',
    array['Qadimgi sivilizatsiyalar', 'Amir Temur davri', 'Buyuk Ipak yo''li', 'Somoniylar davlati', 'Xonliklar davri', 'Birinchi jahon urushi', 'Ikkinchi jahon urushi', 'O''zbekiston mustaqilligi', 'Uyg''onish davri', 'Qadimgi Rim'], 8),
  ('Geografiya', 'geografiya', 'Yer, materiklar, iqlim va tabiiy resurslar.', '🌍',
    array['Yer shari va xarita', 'Materiklar', 'Okeanlar', 'Iqlim', 'O''zbekiston geografiyasi', 'Tabiiy zonalar', 'Aholi geografiyasi', 'Daryolar va ko''llar', 'Relyef', 'Tabiiy resurslar'], 9),
  ('Ingliz tili', 'ingliz-tili', 'Grammatika, lug''at va so''zlashuv.', '🇬🇧',
    array['Present Simple', 'Present Continuous', 'Past Simple', 'Future tenses', 'Articles (a/an/the)', 'Prepositions', 'Modal verbs', 'Comparatives', 'Vocabulary: daily life', 'Reading practice'], 10),
  ('Rus tili', 'rus-tili', 'Rus tili grammatikasi va nutq.', '🇷🇺',
    array['Алфавит и звуки', 'Род существительных', 'Падежи', 'Глаголы', 'Прилагательные', 'Местоимения', 'Предлоги', 'Числительные', 'Диалоги', 'Чтение текста'], 11)
on conflict (slug) do nothing;
