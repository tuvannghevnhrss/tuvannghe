-- ============================================================================
-- Fix: public.interview_tts_cache có policy "service role full access" (từ
-- 20260608_interview_tts_cache.sql) KHÔNG có mệnh đề `TO service_role` —
-- theo đúng ngữ nghĩa Postgres, policy không có `TO` áp dụng cho PUBLIC (mọi
-- role), không chỉ service_role như tên gọi ngụ ý. Đây là lỗi cấu trúc thật
-- trong file migration cũ (không sửa file đó — xem 20260608_interview_tts_cache.sql).
--
-- Test thật (2026-08-17, bảng có 577 dòng thật):
--   - anon SELECT   -> 0 dòng, không lỗi (RLS filter, không phải GRANT deny)
--   - anon INSERT   -> 42501 "new row violates row-level security policy"
--   - authenticated SELECT/INSERT -> giống anon (đều bị chặn)
--   - service_role SELECT -> 577/577 dòng
-- Tức là hành vi LIVE hiện tại đã an toàn cho anon/authenticated (không đọc/
-- ghi được), khác với suy đoán ban đầu dựa trên đọc text migration cũ. Tuy
-- nhiên vì lý do không rõ (có thể policy đã được chỉnh tay ngoài migration
-- này), trạng thái đó không tường minh/không đảm bảo trong source-of-truth
-- SQL. Migration này làm cho việc chặn anon/authenticated trở thành TƯỜNG
-- MINH và ĐÚNG NGỮ NGHĨA trong chính migration history, không dựa vào suy
-- đoán hoặc cấu hình ngoài git.
--
-- Trace code (2026-08-17): toàn bộ truy cập interview_tts_cache trong
-- application code đều qua createInterviewSupabaseClient()
-- (src/app/api/interview/_lib/supabase.ts), hàm này ưu tiên
-- SUPABASE_SERVICE_ROLE_KEY (đã set trong .env.local) trước NEXT_PUBLIC_
-- SUPABASE_ANON_KEY — tức luôn dùng service-role trong deployment hiện tại.
-- 2 route dùng: GET /api/interview/tts (route.ts) và POST
-- /api/interview/tts/seed (seed/route.ts) — cả 2 đều là server route handler,
-- không có "use client" nào import bảng này trực tiếp. Admin Database
-- Explorer (src/lib/admin/services/databaseExplorer.ts) cũng dùng
-- createSupabaseAdminClient() (service-role), không bị ảnh hưởng.
-- => service_role là đúng và đủ access model, không có code path nào cần
-- anon/authenticated đọc bảng này.
--
-- KHÔNG DROP TABLE. KHÔNG DELETE/UPDATE/INSERT dữ liệu. KHÔNG đụng bảng khác.
-- Idempotent — an toàn chạy lại nhiều lần.
-- ============================================================================

-- 1) Xoá mọi policy hiện có trên interview_tts_cache (không đoán tên).
do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'interview_tts_cache'
  loop
    execute format('drop policy if exists %I on public.interview_tts_cache', pol.policyname);
  end loop;
end $$;

-- 2) Đảm bảo RLS được bật.
alter table public.interview_tts_cache enable row level security;

-- 3) Policy mới, tường minh: chỉ service_role.
create policy "service role full access"
on public.interview_tts_cache
for all
to service_role
using (true)
with check (true);

-- 4) Thu hồi quyền bảng đã cấp công khai cho anon/authenticated — lớp phòng
--    thủ bổ sung tường minh, không phụ thuộc riêng vào RLS. service_role của
--    Supabase bypass RLS theo mặc định của platform, không cần GRANT lại.
revoke all on public.interview_tts_cache from anon;
revoke all on public.interview_tts_cache from authenticated;

-- Không tạo policy nào cho anon/authenticated: bảng chỉ được đọc/ghi qua
-- service-role (src/app/api/interview/tts/route.ts,
-- src/app/api/interview/tts/seed/route.ts, Admin Database Explorer).
