-- ============================================================================
-- Fix: public.coupons hiện đọc được bởi anon key qua PostgREST mà không cần
-- đăng nhập (xác nhận bằng test thật ngày 2026-08-16 — đọc được 8 dòng thật
-- gồm code/discount/expires_at/product chỉ bằng public anon key).
--
-- Đây là migration RIÊNG cho coupons — KHÔNG sửa
-- 20260813_core_tables_rls.sql (migration đó cho các bảng khác).
--
-- Phương án A: chỉ service-role được đọc coupons. checkout/route.ts và
-- quote/route.ts đã được đổi sang dùng createSupabaseAdminClient() (service
-- -role) riêng cho câu tra cứu coupon, nên khoá RLS ở đây không ảnh hưởng 2
-- route đó. lib/admin/services/payments.ts đã luôn dùng service-role từ
-- trước, cũng không bị ảnh hưởng. service_role của Supabase bypass RLS theo
-- mặc định của platform — không cần GRANT lại cho service_role trong file
-- này.
--
-- Idempotent — an toàn chạy lại nhiều lần:
--   * DO block xoá MỌI policy hiện có trên coupons (không cần biết tên
--     trước, vì không introspect được pg_policies bằng công cụ hiện có).
--   * ENABLE ROW LEVEL SECURITY không lỗi nếu đã bật sẵn.
--   * REVOKE không lỗi nếu quyền chưa từng được cấp.
--
-- KHÔNG DROP TABLE. KHÔNG DELETE/UPDATE/INSERT dữ liệu. KHÔNG đụng bảng khác.
-- ============================================================================

-- 1) Xoá toàn bộ policy hiện có trên public.coupons (nếu có), không đoán tên.
do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'coupons'
  loop
    execute format('drop policy if exists %I on public.coupons', pol.policyname);
  end loop;
end $$;

-- 2) Đảm bảo RLS được bật trên public.coupons.
alter table public.coupons enable row level security;

-- 3) Thu hồi mọi quyền đã cấp công khai cho anon/authenticated trên bảng
--    này. Với RLS bật và không còn policy nào (bước 1), anon/authenticated
--    sẽ không đọc/ghi được bất kỳ dòng nào qua PostgREST dù có quyền bảng
--    hay không — REVOKE ở đây là lớp phòng thủ bổ sung, tường minh.
revoke all on public.coupons from anon;
revoke all on public.coupons from authenticated;

-- Không tạo policy mới cho anon/authenticated: coupons chỉ được đọc/ghi qua
-- service-role (checkout/route.ts, quote/route.ts, lib/admin/services/payments.ts).
