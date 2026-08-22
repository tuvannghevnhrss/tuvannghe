create extension if not exists "pgcrypto";

create table if not exists public.interview_roles (
  id bigserial primary key,
  name text not null unique,
  slug text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.interview_difficulty_levels (
  id bigserial primary key,
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.interview_experience_levels (
  id bigserial primary key,
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.interview_questions (
  id bigserial primary key,
  role_id bigint references public.interview_roles(id) on delete set null,
  difficulty_level_id bigint references public.interview_difficulty_levels(id) on delete set null,
  experience_level_id bigint references public.interview_experience_levels(id) on delete set null,
  content text not null,
  category text not null default 'general',
  tags text[] not null default '{}',
  ideal_answer text,
  created_at timestamptz not null default now()
);

create table if not exists public.interview_sessions_v2 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_type smallint not null check (module_type in (1, 2, 3)),
  role_id bigint references public.interview_roles(id) on delete set null,
  difficulty_level_id bigint references public.interview_difficulty_levels(id) on delete set null,
  experience_level_id bigint references public.interview_experience_levels(id) on delete set null,
  job_title text,
  language_code text not null default 'vi',
  config jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'recording', 'processing', 'completed', 'failed')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interview_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions_v2(id) on delete cascade,
  question_id bigint references public.interview_questions(id) on delete set null,
  prompt_text text,
  answer_index int not null default 0,
  audio_url text,
  video_url text,
  transcript text,
  duration_seconds numeric(10, 2),
  created_at timestamptz not null default now()
);

create table if not exists public.interview_answer_feedback (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null unique references public.interview_answers(id) on delete cascade,
  score numeric(5, 2),
  strengths text[] not null default '{}',
  weaknesses text[] not null default '{}',
  tips text[] not null default '{}',
  keywords text[] not null default '{}',
  raw_ai_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.interview_session_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.interview_sessions_v2(id) on delete cascade,
  overall_score numeric(5, 2),
  communication_score numeric(5, 2),
  content_score numeric(5, 2),
  confidence_score numeric(5, 2),
  summary text,
  improvement_plan text,
  raw_ai_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists interview_sessions_v2_set_updated_at on public.interview_sessions_v2;
create trigger interview_sessions_v2_set_updated_at
before update on public.interview_sessions_v2
for each row execute function public.set_updated_at();

alter table public.interview_roles enable row level security;
alter table public.interview_difficulty_levels enable row level security;
alter table public.interview_experience_levels enable row level security;
alter table public.interview_questions enable row level security;
alter table public.interview_sessions_v2 enable row level security;
alter table public.interview_answers enable row level security;
alter table public.interview_answer_feedback enable row level security;
alter table public.interview_session_feedback enable row level security;

drop policy if exists "interview lookup read" on public.interview_roles;
create policy "interview lookup read"
on public.interview_roles for select
to authenticated, anon
using (true);

drop policy if exists "interview levels read" on public.interview_difficulty_levels;
create policy "interview levels read"
on public.interview_difficulty_levels for select
to authenticated, anon
using (true);

drop policy if exists "interview experience levels read" on public.interview_experience_levels;
create policy "interview experience levels read"
on public.interview_experience_levels for select
to authenticated, anon
using (true);

drop policy if exists "interview questions read" on public.interview_questions;
create policy "interview questions read"
on public.interview_questions for select
to authenticated, anon
using (true);

drop policy if exists "users read own sessions" on public.interview_sessions_v2;
create policy "users read own sessions"
on public.interview_sessions_v2 for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users create own sessions" on public.interview_sessions_v2;
create policy "users create own sessions"
on public.interview_sessions_v2 for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users update own sessions" on public.interview_sessions_v2;
create policy "users update own sessions"
on public.interview_sessions_v2 for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users read own answers" on public.interview_answers;
create policy "users read own answers"
on public.interview_answers for select
to authenticated
using (
  exists (
    select 1
    from public.interview_sessions_v2 s
    where s.id = interview_answers.session_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "users create own answers" on public.interview_answers;
create policy "users create own answers"
on public.interview_answers for insert
to authenticated
with check (
  exists (
    select 1
    from public.interview_sessions_v2 s
    where s.id = interview_answers.session_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "users read own answer feedback" on public.interview_answer_feedback;
create policy "users read own answer feedback"
on public.interview_answer_feedback for select
to authenticated
using (
  exists (
    select 1
    from public.interview_answers a
    join public.interview_sessions_v2 s on s.id = a.session_id
    where a.id = interview_answer_feedback.answer_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "users read own session feedback" on public.interview_session_feedback;
create policy "users read own session feedback"
on public.interview_session_feedback for select
to authenticated
using (
  exists (
    select 1
    from public.interview_sessions_v2 s
    where s.id = interview_session_feedback.session_id
      and s.user_id = auth.uid()
  )
);

insert into public.interview_roles (name, slug)
values
  ('Frontend Developer', 'frontend-developer'),
  ('Backend Developer', 'backend-developer'),
  ('Fullstack Developer', 'fullstack-developer')
on conflict (name) do nothing;

insert into public.interview_difficulty_levels (name, sort_order)
values
  ('De', 1),
  ('Trung binh', 2),
  ('Kho', 3)
on conflict (name) do nothing;

insert into public.interview_experience_levels (name, sort_order)
values
  ('Sinh vien / Thuc tap sinh', 1),
  ('Moi tot nghiep', 2),
  ('Nhan vien', 3),
  ('Truong nhom / Giam sat', 4),
  ('Quan ly', 5),
  ('Quan ly cap cao', 6),
  ('Dieu hanh cap cao', 7)
on conflict (name) do nothing;

insert into storage.buckets (id, name, public)
values
  ('interview-audio', 'interview-audio', false),
  ('interview-video', 'interview-video', false)
on conflict (id) do nothing;
