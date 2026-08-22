-- ============================================================
-- Dọn schema drift phát hiện khi build Back Office (M0–M5):
-- migration cũ (20260409_interview_foundation.sql) không còn khớp
-- schema thật trên production — file này KHÔNG sửa migration cũ
-- (không bao giờ sửa migration đã áp), chỉ bổ sung baseline mới.
-- ============================================================

-- interview_questions từng có 2 cặp cột trùng ý nghĩa: role_id/difficulty_level_id/
-- experience_level_id (đang dùng thật, xem app/api/interview/questions,
-- app/api/interview/session/[id]) và level_id/difficulty_id (rác, đã xác nhận
-- 0 chỗ trong code đọc/ghi qua grep toàn bộ src/).
alter table public.interview_questions drop column if exists level_id;
alter table public.interview_questions drop column if exists difficulty_id;

-- interview_experience_levels có sort_order để sắp xếp trong UI, nhưng
-- interview_difficulty_levels thì không — thêm cho nhất quán giữa 2 bảng lookup
-- cùng vai trò (đều hiển thị dạng danh sách có thứ tự trong Back Office).
alter table public.interview_difficulty_levels add column if not exists sort_order int not null default 0;
