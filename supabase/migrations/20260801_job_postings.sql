create extension if not exists "pgcrypto";

create table if not exists public.job_postings (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  company          text not null,
  location         text not null default 'Toàn quốc',
  employment_type  text not null default 'full_time'
                     check (employment_type in ('full_time', 'part_time', 'remote', 'internship', 'contract')),
  category         text not null default 'Khác',
  level            text,
  salary_display   text,
  description      text not null,
  requirements     text,
  benefits         text,
  contact_email    text,
  apply_url        text,
  status           text not null default 'draft'
                     check (status in ('draft', 'published', 'closed')),
  deadline         date,
  posted_at        timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists job_postings_status_posted_at_idx
  on public.job_postings (status, posted_at desc);

create index if not exists job_postings_category_idx
  on public.job_postings (category);

alter table public.job_postings enable row level security;

-- Ai cũng đọc được tin đã publish (trang /tuyendung công khai)
drop policy if exists "job_postings_public_read" on public.job_postings;
create policy "job_postings_public_read"
  on public.job_postings
  for select
  using (status = 'published');

-- Không có policy insert/update/delete cho anon/authenticated:
-- mọi thao tác ghi đi qua API route dùng SUPABASE_SERVICE_ROLE_KEY,
-- được gác bởi allowlist ADMIN_EMAILS ở tầng server.

create or replace function public.set_job_postings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists job_postings_set_updated_at on public.job_postings;
create trigger job_postings_set_updated_at
  before update on public.job_postings
  for each row
  execute function public.set_job_postings_updated_at();
