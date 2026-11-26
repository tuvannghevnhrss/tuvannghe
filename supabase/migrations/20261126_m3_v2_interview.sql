-- Module 3 v2 — AI Interview thích ứng (CV/JD → kế hoạch → phỏng vấn → đánh giá)
-- Chỉ THÊM bảng mới (không sửa/xóa bảng hiện có). Idempotent: chạy lại an toàn.
-- Rollback: supabase/rollbacks/20261126_m3_v2_interview_down.sql

create extension if not exists pgcrypto;

/* ───────────── CV ───────────── */
create table if not exists public.m3_cv_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_size integer not null default 0,
  file_kind text not null check (file_kind in ('pdf', 'docx')),
  storage_path text,                              -- chỉ có khi người dùng đồng ý lưu file gốc
  stored_original boolean not null default false,
  consent_at timestamptz not null,                -- bắt buộc: người dùng đồng ý xử lý CV
  text_hash text,
  text_chars integer,
  language text,
  parsed jsonb,                                   -- JSON đã trích xuất (không gồm email/điện thoại)
  injection jsonb not null default '{}'::jsonb,   -- cảnh báo prompt-injection
  status text not null default 'ready' check (status in ('processing', 'ready', 'failed')),
  error text,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists m3_cv_documents_user_idx on public.m3_cv_documents (user_id, created_at desc);
create index if not exists m3_cv_documents_expires_idx on public.m3_cv_documents (expires_at);

/* ───────────── JD ───────────── */
create table if not exists public.m3_job_descriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  raw_text text not null,
  language text,
  parsed jsonb,
  injection jsonb not null default '{}'::jsonb,
  status text not null default 'ready' check (status in ('processing', 'ready', 'failed')),
  error text,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists m3_job_descriptions_user_idx on public.m3_job_descriptions (user_id, created_at desc);

/* ───────────── Buổi phỏng vấn ───────────── */
create table if not exists public.m3_interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cv_id uuid not null references public.m3_cv_documents(id) on delete cascade,
  jd_id uuid not null references public.m3_job_descriptions(id) on delete cascade,
  config jsonb not null default '{}'::jsonb,      -- loại phỏng vấn, độ nghiêm khắc, thời lượng, ngôn ngữ, giọng
  match jsonb,                                    -- ma trận đối chiếu CV–JD
  plan jsonb,                                     -- kế hoạch phỏng vấn
  state jsonb not null default '{}'::jsonb,       -- bộ nhớ điều phối (đã hỏi gì, coverage, ...)
  status text not null default 'draft'
    check (status in ('draft', 'planned', 'in_progress', 'completed', 'abandoned', 'failed')),
  session_id uuid references public.interview_sessions_v2(id) on delete set null, -- tái dùng hạn mức Module 3
  cost_usd numeric(10, 4) not null default 0,
  started_at timestamptz,
  ended_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists m3_interviews_user_idx on public.m3_interviews (user_id, created_at desc);

create table if not exists public.m3_messages (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.m3_interviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  turn_index integer not null,
  role text not null check (role in ('interviewer', 'candidate')),
  content text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (interview_id, turn_index, role)
);
create index if not exists m3_messages_interview_idx on public.m3_messages (interview_id, turn_index);

create table if not exists public.m3_competency_evidence (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.m3_interviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  turn_index integer not null,
  competency_id text not null,
  quote text not null,
  signal text not null check (signal in ('positive', 'negative', 'neutral')),
  strength smallint not null check (strength between 1 and 5),
  star jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists m3_evidence_interview_idx on public.m3_competency_evidence (interview_id, turn_index);

create table if not exists public.m3_evaluations (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null unique references public.m3_interviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  overall_score numeric(5, 2) not null,
  recommendation text not null
    check (recommendation in ('highly_recommended', 'recommended', 'consider', 'not_recommended')),
  report jsonb not null,
  model text,
  created_at timestamptz not null default now()
);

create table if not exists public.m3_ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  interview_id uuid references public.m3_interviews(id) on delete set null,
  stage text not null,
  model text not null,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  latency_ms integer not null default 0,
  cost_usd numeric(10, 5) not null default 0,
  ok boolean not null default true,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists m3_ai_usage_interview_idx on public.m3_ai_usage (interview_id, created_at);

/* ───────────── updated_at ───────────── */
-- public.set_updated_at() đã tồn tại từ migration interview_foundation
drop trigger if exists m3_cv_documents_updated on public.m3_cv_documents;
create trigger m3_cv_documents_updated before update on public.m3_cv_documents
  for each row execute function public.set_updated_at();
drop trigger if exists m3_job_descriptions_updated on public.m3_job_descriptions;
create trigger m3_job_descriptions_updated before update on public.m3_job_descriptions
  for each row execute function public.set_updated_at();
drop trigger if exists m3_interviews_updated on public.m3_interviews;
create trigger m3_interviews_updated before update on public.m3_interviews
  for each row execute function public.set_updated_at();

/* ───────────── RLS: chỉ chủ sở hữu ───────────── */
alter table public.m3_cv_documents enable row level security;
alter table public.m3_job_descriptions enable row level security;
alter table public.m3_interviews enable row level security;
alter table public.m3_messages enable row level security;
alter table public.m3_competency_evidence enable row level security;
alter table public.m3_evaluations enable row level security;
alter table public.m3_ai_usage enable row level security;

drop policy if exists "m3 cv own" on public.m3_cv_documents;
create policy "m3 cv own" on public.m3_cv_documents for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "m3 jd own" on public.m3_job_descriptions;
create policy "m3 jd own" on public.m3_job_descriptions for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "m3 interviews own" on public.m3_interviews;
create policy "m3 interviews own" on public.m3_interviews for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Tin nhắn / bằng chứng / đánh giá / usage: người dùng chỉ đọc (và xóa qua cascade); ghi do máy chủ (service role) thực hiện.
drop policy if exists "m3 messages read own" on public.m3_messages;
create policy "m3 messages read own" on public.m3_messages for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "m3 evidence read own" on public.m3_competency_evidence;
create policy "m3 evidence read own" on public.m3_competency_evidence for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "m3 evaluations read own" on public.m3_evaluations;
create policy "m3 evaluations read own" on public.m3_evaluations for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "m3 usage read own" on public.m3_ai_usage;
create policy "m3 usage read own" on public.m3_ai_usage for select to authenticated
  using (auth.uid() = user_id);

/* ───────────── Storage: bucket riêng tư cho CV gốc (chỉ khi người dùng đồng ý lưu) ───────────── */
insert into storage.buckets (id, name, public, file_size_limit)
values ('m3-cv', 'm3-cv', false, 5242880)
on conflict (id) do update set public = false, file_size_limit = 5242880;

drop policy if exists "m3 cv files read own" on storage.objects;
create policy "m3 cv files read own" on storage.objects for select to authenticated
  using (bucket_id = 'm3-cv' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "m3 cv files delete own" on storage.objects;
create policy "m3 cv files delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'm3-cv' and (storage.foldername(name))[1] = auth.uid()::text);

/* ───────────── Chính sách lưu trữ: hàm dọn dữ liệu hết hạn (gọi bởi endpoint bảo vệ bằng CRON_SECRET) ───────────── */
create or replace function public.m3_purge_expired()
returns table (cv_deleted integer, jd_deleted integer, interviews_deleted integer)
language plpgsql
security definer
set search_path = public
as $$
declare c integer; j integer; i integer;
begin
  delete from public.m3_interviews where expires_at < now();
  get diagnostics i = row_count;
  delete from public.m3_cv_documents where expires_at < now();
  get diagnostics c = row_count;
  delete from public.m3_job_descriptions where expires_at < now();
  get diagnostics j = row_count;
  return query select c, j, i;
end;
$$;
revoke all on function public.m3_purge_expired() from public, anon, authenticated;
