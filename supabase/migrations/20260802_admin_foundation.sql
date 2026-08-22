create extension if not exists "pgcrypto";

-- ============================================================
-- admin_users — thay thế dần allowlist ADMIN_EMAILS (env var)
-- ============================================================
create table if not exists public.admin_users (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('super_admin', 'ops_manager', 'finance', 'content', 'ai_ops', 'support')),
  scopes      jsonb not null default '{}'::jsonb,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Mỗi user chỉ đọc được đúng dòng của mình — đủ để middleware/layout
-- kiểm tra "tôi có phải admin không" bằng session client (anon key + cookie),
-- không cần service-role cho việc đọc trạng thái của chính mình.
drop policy if exists "admin_users read own row" on public.admin_users;
create policy "admin_users read own row"
  on public.admin_users
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Không có policy insert/update/delete cho anon/authenticated:
-- mọi thao tác ghi (mời/đổi role) đi qua API route dùng SUPABASE_SERVICE_ROLE_KEY,
-- gác bởi requireAdmin('settings', 'full') ở tầng ứng dụng (module Cài đặt hệ thống).

-- ============================================================
-- audit_logs — append-only, không có policy đọc/ghi công khai.
-- Chỉ service-role (bỏ qua RLS) mới chạm được, và chỉ sau khi
-- route admin đã qua requireAdmin() ở tầng ứng dụng.
-- ============================================================
create table if not exists public.audit_logs (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid references auth.users(id) on delete set null,
  actor_email   text,
  action        text not null,
  resource_type text not null,
  resource_id   text,
  before        jsonb,
  after         jsonb,
  ip            text,
  user_agent    text,
  created_at    timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_actor_idx      on public.audit_logs (actor_id);
create index if not exists audit_logs_resource_idx   on public.audit_logs (resource_type, resource_id);

alter table public.audit_logs enable row level security;
-- Cố ý không tạo policy nào — bảng chỉ truy cập được qua service-role client.
