-- Rollback cho 20261126_m3_v2_interview.sql (chỉ xóa các bảng/hàm do migration này tạo).
-- CẢNH BÁO: xóa toàn bộ dữ liệu Module 3 v2 (CV đã phân tích, transcript, báo cáo).
drop function if exists public.m3_purge_expired();
drop table if exists public.m3_ai_usage;
drop table if exists public.m3_evaluations;
drop table if exists public.m3_competency_evidence;
drop table if exists public.m3_messages;
drop table if exists public.m3_interviews;
drop table if exists public.m3_job_descriptions;
drop table if exists public.m3_cv_documents;
drop policy if exists "m3 cv files read own" on storage.objects;
drop policy if exists "m3 cv files delete own" on storage.objects;
-- Bucket 'm3-cv' chỉ xóa được sau khi đã xóa hết object bên trong (qua Dashboard hoặc Storage API).
