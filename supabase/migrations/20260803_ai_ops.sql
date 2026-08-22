create extension if not exists "pgcrypto";

-- ============================================================
-- ai_usage_logs — mọi lời gọi OpenAI đi qua lib/openai.ts đều ghi 1 dòng ở đây.
-- Không có policy công khai: chỉ service-role (bỏ qua RLS) đọc/ghi được.
-- ============================================================
create table if not exists public.ai_usage_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete set null,
  session_id     text,
  route          text not null,
  provider       text not null default 'openai',
  model          text not null,
  prompt_key     text,
  prompt_version int,
  input_tokens   integer not null default 0,
  output_tokens  integer not null default 0,
  cost_usd       numeric(10, 6) not null default 0,
  latency_ms     integer,
  status         text not null default 'ok' check (status in ('ok', 'error')),
  created_at     timestamptz not null default now()
);

create index if not exists ai_usage_logs_created_at_idx on public.ai_usage_logs (created_at desc);
create index if not exists ai_usage_logs_route_idx      on public.ai_usage_logs (route);
create index if not exists ai_usage_logs_user_idx       on public.ai_usage_logs (user_id);

alter table public.ai_usage_logs enable row level security;
-- Cố ý không tạo policy nào.

-- ============================================================
-- prompts — mỗi (key, version) là 1 dòng bất biến; chỉ 1 version/key được
-- phép ở trạng thái "live" tại một thời điểm (ép bằng unique index có điều kiện).
-- ============================================================
create table if not exists public.prompts (
  id          uuid primary key default gen_random_uuid(),
  key         text not null,
  version     int not null,
  module      text not null default 'general',
  template    text not null,
  variables   jsonb not null default '[]'::jsonb,
  status      text not null default 'draft' check (status in ('draft', 'live', 'archived')),
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (key, version)
);

create unique index if not exists prompts_key_live_uidx on public.prompts (key) where status = 'live';
create index if not exists prompts_key_idx on public.prompts (key);

alter table public.prompts enable row level security;
-- Cố ý không tạo policy nào — đọc qua resolvePrompt()/service-role, sửa qua Prompt Management (admin).

-- Seed: đưa system prompt hiện tại của /api/chat vào làm bản "live" đầu tiên,
-- giữ nguyên nội dung để không đổi hành vi sản phẩm tại thời điểm cutover.
insert into public.prompts (key, version, module, template, variables, status)
values (
  'chat.system',
  1,
  'chat',
  'Bạn là trợ lý hướng nghiệp tích hợp vào website. Trả lời ngắn gọn, rõ ràng, và thân thiện.',
  '[]'::jsonb,
  'live'
)
on conflict (key, version) do nothing;
