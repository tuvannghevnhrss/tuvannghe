create extension if not exists "pgcrypto";

-- ============================================================
-- system_settings — key-value tuỳ ý, override cho lib/constants.ts.
-- Không có policy công khai; chỉ service-role đọc/ghi.
-- ============================================================
create table if not exists public.system_settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_by  uuid references auth.users(id) on delete set null,
  updated_at  timestamptz not null default now()
);

alter table public.system_settings enable row level security;
-- Cố ý không tạo policy nào.

-- ============================================================
-- feature_flags — cờ bật/tắt tính năng, tách riêng khỏi system_settings
-- để đọc nhanh (đọc mỗi request ở các route nhạy cảm như checkout).
-- ============================================================
create table if not exists public.feature_flags (
  key             text primary key,
  enabled         boolean not null default false,
  rollout_percent int not null default 100 check (rollout_percent between 0 and 100),
  description     text,
  updated_at      timestamptz not null default now()
);

alter table public.feature_flags enable row level security;
-- Cố ý không tạo policy nào.

insert into public.feature_flags (key, enabled, description)
values ('maintenance_mode', false, 'Khi bật: chặn tạo giao dịch thanh toán mới trên toàn site (POST /api/payments/checkout).')
on conflict (key) do nothing;
