create extension if not exists "pgcrypto";

-- ============================================================
-- notifications — dùng chung cho cảnh báo nội bộ Back Office
-- (user_id null = broadcast cho team admin) và để dành cho thông báo
-- hướng tới user thật khi cần (user_id có giá trị) — chưa xây UI phía
-- user trong M4, chỉ dựng schema cho sẵn.
-- Không có policy công khai; chỉ service-role đọc/ghi.
-- ============================================================
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  link       text,
  channel    text not null default 'in_app' check (channel in ('in_app', 'email')),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx         on public.notifications (user_id);
create index if not exists notifications_created_at_idx   on public.notifications (created_at desc);
create index if not exists notifications_type_created_idx on public.notifications (type, created_at desc);

alter table public.notifications enable row level security;
-- Cố ý không tạo policy nào.
