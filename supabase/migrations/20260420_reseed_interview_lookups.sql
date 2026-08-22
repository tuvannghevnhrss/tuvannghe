-- Fix interview lookup tables: normalize names to proper Vietnamese with diacritics
-- Strategy:
--   difficulty_levels: 6 rows (3 English + 3 ASCII-Vietnamese) → delete English duplicates, update ASCII
--   experience_levels: 7 rows (all ASCII-Vietnamese, no duplicates) → UPDATE only
--   roles: mixed English/ASCII → UPDATE only (no duplicates per name)

-- ── 1. interview_difficulty_levels ───────────────────────────────────────────
-- Delete English-named duplicates (old seed). FK on interview_sessions_v2 is ON DELETE SET NULL.
DELETE FROM public.interview_difficulty_levels WHERE name IN ('easy', 'Easy', 'medium', 'Medium', 'hard', 'Hard');

-- Now update the remaining 3 ASCII-Vietnamese rows
UPDATE public.interview_difficulty_levels SET name = 'Dễ'         WHERE name = 'De';
UPDATE public.interview_difficulty_levels SET name = 'Trung bình'  WHERE name = 'Trung binh';
UPDATE public.interview_difficulty_levels SET name = 'Khó'         WHERE name = 'Kho';

-- ── 2. interview_experience_levels ───────────────────────────────────────────
UPDATE public.interview_experience_levels SET name = 'Sinh viên / Thực tập sinh' WHERE name = 'Sinh vien / Thuc tap sinh';
UPDATE public.interview_experience_levels SET name = 'Mới tốt nghiệp'            WHERE name = 'Moi tot nghiep';
UPDATE public.interview_experience_levels SET name = 'Nhân viên'                  WHERE name = 'Nhan vien';
UPDATE public.interview_experience_levels SET name = 'Trưởng nhóm / Giám sát'    WHERE name = 'Truong nhom / Giam sat';
UPDATE public.interview_experience_levels SET name = 'Quản lý'                    WHERE name = 'Quan ly';
UPDATE public.interview_experience_levels SET name = 'Quản lý cấp cao'           WHERE name = 'Quan ly cap cao';
UPDATE public.interview_experience_levels SET name = 'Điều hành cấp cao'         WHERE name = 'Dieu hanh cap cao';

-- ── 3. interview_roles ───────────────────────────────────────────────────────
UPDATE public.interview_roles SET name = 'Nhân sự'                    WHERE name = 'Nhan su';
UPDATE public.interview_roles SET name = 'Kế toán'                    WHERE name = 'Ke toan';
UPDATE public.interview_roles SET name = 'Kinh doanh / Bán hàng'      WHERE name = 'Kinh doanh / Ban hang';
UPDATE public.interview_roles SET name = 'Công nghệ thông tin'         WHERE name = 'Cong nghe thong tin';
UPDATE public.interview_roles SET name = 'Chăm sóc khách hàng'        WHERE name = 'Cham soc khach hang';
UPDATE public.interview_roles SET name = 'Hành chính / Văn phòng'     WHERE name = 'Hanh chinh / Van phong';
UPDATE public.interview_roles SET name = 'Logistics / Chuỗi cung ứng' WHERE name = 'Logistics / Chuoi cung ung';
UPDATE public.interview_roles SET name = 'Tài chính / Đầu tư'         WHERE name = 'Tai chinh / Dau tu';
UPDATE public.interview_roles SET name = 'Thiết kế / Sáng tạo'        WHERE name = 'Thiet ke / Sang tao';
UPDATE public.interview_roles SET name = 'Luật / Pháp lý'             WHERE name = 'Luat / Phap ly';
UPDATE public.interview_roles SET name = 'Nhà hàng / Khách sạn'       WHERE name = 'Nha hang / Khach san';
UPDATE public.interview_roles SET name = 'Lập trình / Phần mềm'       WHERE name = 'Frontend Developer';
UPDATE public.interview_roles SET name = 'Lập trình / Phần mềm'       WHERE name = 'Backend Developer';
UPDATE public.interview_roles SET name = 'Lập trình / Phần mềm'       WHERE name = 'Fullstack Developer';
