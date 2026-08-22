-- ============================================================================
-- Interview Module 1 — Take/Answer architecture, production-ready.
--
-- Business rule: 1 câu hỏi có N take (bản ghi thô), nhưng chỉ có 1 "current
-- answer" (kết quả phân tích hiện tại) cho mỗi (session_id, answer_index).
-- Take chọn hiện tại (selected_take_id) và trạng thái phân tích (status) được
-- gắn vào answer hiện có thay vì tạo answer mới mỗi lần chọn take khác/retry.
--
-- Đây là migration THUẦN ADDITIVE — không xoá bảng/cột, không đổi kiểu dữ
-- liệu cột cũ, không xoá dữ liệu. An toàn để chạy trên production mà không
-- ảnh hưởng dữ liệu hiện có.
--
-- KHÔNG bao gồm UNIQUE(session_id, answer_index) trên interview_answers —
-- xem ghi chú "DUPLICATE CHECK" ở cuối file: cần chạy query kiểm tra trước,
-- báo cáo kết quả, rồi mới quyết định có thêm constraint hay không.
-- ============================================================================

-- ── Bảng mới: interview_answer_takes ───────────────────────────────────────
-- Lưu MỌI bản ghi thô (Take 1, 2, 3...) ngay sau khi user bấm "Dừng ghi âm",
-- độc lập với việc đã phân tích hay chưa — để recording không mất khi refresh.
create table if not exists public.interview_answer_takes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions_v2(id) on delete cascade,
  answer_index int not null default 0,
  storage_path text not null,
  duration_seconds numeric(10, 2),
  status text not null default 'uploaded' check (status in ('uploaded', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists interview_answer_takes_session_idx
  on public.interview_answer_takes (session_id, answer_index);

alter table public.interview_answer_takes enable row level security;

drop policy if exists "users read own takes" on public.interview_answer_takes;
create policy "users read own takes"
on public.interview_answer_takes for select
to authenticated
using (
  exists (
    select 1 from public.interview_sessions_v2 s
    where s.id = interview_answer_takes.session_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "users create own takes" on public.interview_answer_takes;
create policy "users create own takes"
on public.interview_answer_takes for insert
to authenticated
with check (
  exists (
    select 1 from public.interview_sessions_v2 s
    where s.id = interview_answer_takes.session_id
      and s.user_id = auth.uid()
  )
);

-- ── interview_answers: thêm cột (KHÔNG xoá/đổi cột cũ) ─────────────────────
-- selected_take_id: take nào đang được dùng làm kết quả hiện tại.
-- status: trạng thái phân tích của answer hiện tại (không phải của take).
-- updated_at: cần để phân biệt lần phân tích gần nhất khi UPDATE thay vì INSERT.
alter table public.interview_answers
  add column if not exists selected_take_id uuid references public.interview_answer_takes(id) on delete set null,
  add column if not exists status text not null default 'completed' check (status in ('draft', 'processing', 'completed', 'failed')),
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists interview_answers_set_updated_at on public.interview_answers;
create trigger interview_answers_set_updated_at
before update on public.interview_answers
for each row execute function public.set_updated_at();

-- ============================================================================
-- DUPLICATE CHECK (chạy trước khi cân nhắc thêm UNIQUE constraint)
-- ============================================================================
-- Chạy query dưới đây trong SQL Editor để kiểm tra xem hiện có session nào
-- đã có NHIỀU HƠN 1 answer cho cùng answer_index hay không (dữ liệu cũ được
-- ghi bằng logic INSERT-only trước khi có migration này):
--
--   select session_id, answer_index, count(*) as cnt
--   from public.interview_answers
--   group by session_id, answer_index
--   having count(*) > 1
--   order by cnt desc;
--
-- - Nếu kết quả RỖNG: có thể an toàn thêm constraint sau (migration riêng):
--     alter table public.interview_answers
--       add constraint interview_answers_session_question_unique
--       unique (session_id, answer_index);
-- - Nếu CÓ duplicate: KHÔNG tự xoá dữ liệu cũ — cần quyết định thủ công nên
--   giữ bản nào (mới nhất theo created_at? có feedback đầy đủ nhất?) trước
--   khi áp constraint. Báo cáo lại kết quả trước khi chạy bước tiếp theo.
-- ============================================================================
