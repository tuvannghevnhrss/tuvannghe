-- ============================================================================
-- Bật RLS + policy "chỉ chủ sở hữu" cho các bảng dữ liệu người dùng cốt lõi.
--
-- PHÁT HIỆN (đối chiếu backup.dump lấy ngày 2026-04-06):
--   payments, career_profiles, career_goal, career_actions, career_plan,
--   career_options, career_focus, career_goals, profiles: KHÔNG có
--   "ENABLE ROW LEVEL SECURITY" + có "GRANT ALL ... TO anon/authenticated"
--   → BẤT KỲ ai cầm public anon key (luôn lộ ở client bundle) đều có thể
--   đọc/ghi/xoá TRỰC TIẾP qua Supabase REST API, bỏ qua toàn bộ kiểm tra
--   user_id trong route handler của app. Đây là lỗ hổng nghiêm trọng nhất
--   tìm được trong đợt review này — cần áp dụng ngay.
--
--   knowdell_skills, knowdell_values: RLS đã bật nhưng KHÔNG có policy nào
--   → khoá hoàn toàn kể cả với chính chủ; API insert không kiểm tra lỗi nên
--   UI báo "đã lưu" nhưng dữ liệu không thực sự được ghi.
--
--   coupons: GRANT ALL cho anon — ai cũng có thể tự tạo/sửa mã giảm giá qua
--   REST API trực tiếp, bỏ qua admin panel.
--
-- LƯU Ý TRƯỚC KHI CHẠY:
--   1. Đây là thay đổi trên DATABASE THẬT — hãy chạy thử ở project
--      staging/dev trước nếu có, hoặc backup trước khi áp dụng lên production.
--   2. Kiểm tra lại Supabase Dashboard → Database → Policies xem có policy
--      nào đã tồn tại (được tạo thủ công, không nằm trong migration) trùng
--      tên với policy dưới đây không, để tránh lỗi "policy already exists".
--   3. Áp dụng bằng `supabase db push` hoặc dán trực tiếp vào SQL Editor.
-- ============================================================================

-- ── payments ────────────────────────────────────────────────────────────
alter table public.payments enable row level security;

drop policy if exists "payments_select" on public.payments; -- policy cũ (đã có nhưng vô hiệu vì thiếu ENABLE RLS)
drop policy if exists "users read own payments" on public.payments;
create policy "users read own payments"
on public.payments for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users insert own payments" on public.payments;
create policy "users insert own payments"
on public.payments for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users update own payments" on public.payments;
create policy "users update own payments"
on public.payments for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ── career_profiles ─────────────────────────────────────────────────────
alter table public.career_profiles enable row level security;

drop policy if exists "users manage own career_profiles select" on public.career_profiles;
create policy "users manage own career_profiles select"
on public.career_profiles for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users manage own career_profiles insert" on public.career_profiles;
create policy "users manage own career_profiles insert"
on public.career_profiles for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users manage own career_profiles update" on public.career_profiles;
create policy "users manage own career_profiles update"
on public.career_profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ── career_goal ─────────────────────────────────────────────────────────
alter table public.career_goal enable row level security;

drop policy if exists "users manage own career_goal select" on public.career_goal;
create policy "users manage own career_goal select"
on public.career_goal for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users manage own career_goal insert" on public.career_goal;
create policy "users manage own career_goal insert"
on public.career_goal for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users manage own career_goal update" on public.career_goal;
create policy "users manage own career_goal update"
on public.career_goal for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ── career_actions ──────────────────────────────────────────────────────
alter table public.career_actions enable row level security;

drop policy if exists "users manage own career_actions select" on public.career_actions;
create policy "users manage own career_actions select"
on public.career_actions for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users manage own career_actions insert" on public.career_actions;
create policy "users manage own career_actions insert"
on public.career_actions for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users manage own career_actions update" on public.career_actions;
create policy "users manage own career_actions update"
on public.career_actions for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ── career_plan ─────────────────────────────────────────────────────────
alter table public.career_plan enable row level security;

drop policy if exists "users manage own career_plan select" on public.career_plan;
create policy "users manage own career_plan select"
on public.career_plan for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users manage own career_plan insert" on public.career_plan;
create policy "users manage own career_plan insert"
on public.career_plan for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users manage own career_plan update" on public.career_plan;
create policy "users manage own career_plan update"
on public.career_plan for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ── career_options ──────────────────────────────────────────────────────
alter table public.career_options enable row level security;

drop policy if exists "users manage own career_options select" on public.career_options;
create policy "users manage own career_options select"
on public.career_options for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users manage own career_options insert" on public.career_options;
create policy "users manage own career_options insert"
on public.career_options for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users manage own career_options delete" on public.career_options;
create policy "users manage own career_options delete"
on public.career_options for delete
to authenticated
using (auth.uid() = user_id);

-- ── career_focus / career_goals (bảng cũ, app không còn dùng nhưng vẫn tồn
--    tại trên DB với GRANT ALL — khoá lại phòng ngừa) ────────────────────
alter table public.career_focus enable row level security;

drop policy if exists "users manage own career_focus" on public.career_focus;
create policy "users manage own career_focus"
on public.career_focus for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table public.career_goals enable row level security;

drop policy if exists "users manage own career_goals" on public.career_goals;
create policy "users manage own career_goals"
on public.career_goals for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ── profiles ────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

drop policy if exists "users manage own profiles select" on public.profiles;
create policy "users manage own profiles select"
on public.profiles for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users manage own profiles insert" on public.profiles;
create policy "users manage own profiles insert"
on public.profiles for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users manage own profiles update" on public.profiles;
create policy "users manage own profiles update"
on public.profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ── knowdell_skills / knowdell_values ───────────────────────────────────
-- RLS đã bật từ trước nhưng CHƯA từng có policy nào → hiện đang khoá hoàn
-- toàn, kể cả chính chủ. Thêm policy còn thiếu.
drop policy if exists "users manage own knowdell_skills select" on public.knowdell_skills;
create policy "users manage own knowdell_skills select"
on public.knowdell_skills for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users manage own knowdell_skills insert" on public.knowdell_skills;
create policy "users manage own knowdell_skills insert"
on public.knowdell_skills for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users manage own knowdell_skills delete" on public.knowdell_skills;
create policy "users manage own knowdell_skills delete"
on public.knowdell_skills for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users manage own knowdell_values select" on public.knowdell_values;
create policy "users manage own knowdell_values select"
on public.knowdell_values for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users manage own knowdell_values insert" on public.knowdell_values;
create policy "users manage own knowdell_values insert"
on public.knowdell_values for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users manage own knowdell_values delete" on public.knowdell_values;
create policy "users manage own knowdell_values delete"
on public.knowdell_values for delete
to authenticated
using (auth.uid() = user_id);

-- ── coupons ─────────────────────────────────────────────────────────────
-- Bảng dùng chung (không có user_id) — checkout cần đọc để validate mã, còn
-- việc tạo/sửa/xoá coupon chỉ nên qua admin panel (dùng service-role, không
-- bị RLS chặn) nên KHÔNG cấp insert/update/delete cho anon/authenticated.
alter table public.coupons enable row level security;

drop policy if exists "coupons public read" on public.coupons;
create policy "coupons public read"
on public.coupons for select
to authenticated, anon
using (true);
