-- Kiểm thử RLS: mỗi lệnh \echo in kết quả, các lệnh `do` ném lỗi nếu sai.
\set ON_ERROR_STOP on
delete from auth.users where id in ('aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002');
insert into auth.users (id) values ('aaaaaaaa-0000-0000-0000-000000000001'), ('bbbbbbbb-0000-0000-0000-000000000002');

-- Dữ liệu của A và B được tạo bằng quyền cao (như service role)
insert into public.m3_cv_documents (id, user_id, file_name, file_kind, consent_at, parsed)
values ('a1111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'a.pdf', 'pdf', now(), '{"secret":"A"}'),
       ('b2222222-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002', 'b.pdf', 'pdf', now(), '{"secret":"B"}');
insert into public.m3_job_descriptions (id, user_id, title, raw_text)
values ('a1111111-0000-0000-0000-0000000000f1', 'aaaaaaaa-0000-0000-0000-000000000001', 'JD A', 'x');
insert into public.m3_interviews (id, user_id, cv_id, jd_id)
values ('a1111111-0000-0000-0000-0000000000e1', 'aaaaaaaa-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-0000000000f1');
insert into public.m3_messages (interview_id, user_id, turn_index, role, content)
values ('a1111111-0000-0000-0000-0000000000e1', 'aaaaaaaa-0000-0000-0000-000000000001', 1, 'interviewer', 'hello');
insert into public.m3_evaluations (interview_id, user_id, overall_score, recommendation, report)
values ('a1111111-0000-0000-0000-0000000000e1', 'aaaaaaaa-0000-0000-0000-000000000001', 70, 'recommended', '{}');
insert into storage.objects (bucket_id, name) values ('m3-cv', 'aaaaaaaa-0000-0000-0000-000000000001/cv.pdf'), ('m3-cv', 'bbbbbbbb-0000-0000-0000-000000000002/cv.pdf');

-- ── Người dùng B ──
set role authenticated;
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000002', false);
do $$ declare n int; begin
  select count(*) into n from public.m3_cv_documents; if n <> 1 then raise exception 'B thấy % CV (mong đợi 1)', n; end if;
  select count(*) into n from public.m3_cv_documents where user_id = 'aaaaaaaa-0000-0000-0000-000000000001'; if n <> 0 then raise exception 'B đọc được CV của A'; end if;
  select count(*) into n from public.m3_job_descriptions; if n <> 0 then raise exception 'B đọc được JD của A'; end if;
  select count(*) into n from public.m3_interviews; if n <> 0 then raise exception 'B đọc được interview của A'; end if;
  select count(*) into n from public.m3_messages; if n <> 0 then raise exception 'B đọc được tin nhắn của A'; end if;
  select count(*) into n from public.m3_evaluations; if n <> 0 then raise exception 'B đọc được đánh giá của A'; end if;
  select count(*) into n from storage.objects where bucket_id = 'm3-cv'; if n <> 1 then raise exception 'B thấy % file CV (mong đợi 1)', n; end if;
end $$;
\echo OK: B chỉ thấy dữ liệu của mình

do $$ begin
  begin
    insert into public.m3_cv_documents (user_id, file_name, file_kind, consent_at) values ('aaaaaaaa-0000-0000-0000-000000000001', 'x.pdf', 'pdf', now());
    raise exception 'B ghi được CV mạo danh A';
  exception when insufficient_privilege or check_violation then null; end;
  begin
    insert into public.m3_messages (interview_id, user_id, turn_index, role, content) values ('a1111111-0000-0000-0000-0000000000e1', 'bbbbbbbb-0000-0000-0000-000000000002', 9, 'candidate', 'giả mạo');
    raise exception 'B ghi được tin nhắn vào interview của A';
  exception when insufficient_privilege or check_violation then null; end;
end $$;
\echo OK: B không thể ghi mạo danh

do $$ declare n int; begin
  delete from public.m3_cv_documents where id = 'a1111111-0000-0000-0000-000000000001'; get diagnostics n = row_count;
  if n <> 0 then raise exception 'B xóa được CV của A'; end if;
  update public.m3_interviews set status = 'completed' where id = 'a1111111-0000-0000-0000-0000000000e1'; get diagnostics n = row_count;
  if n <> 0 then raise exception 'B sửa được interview của A'; end if;
end $$;
\echo OK: B không thể xóa/sửa dữ liệu của A

do $$ begin
  begin perform public.m3_purge_expired(); raise exception 'authenticated gọi được m3_purge_expired'; exception when insufficient_privilege then null; end;
end $$;
\echo OK: người dùng không gọi được hàm dọn dữ liệu

-- ── Người dùng A xóa CV → cascade interview/messages/evaluation ──
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', false);
do $$ declare n int; begin
  select count(*) into n from public.m3_interviews; if n <> 1 then raise exception 'A không thấy interview của mình'; end if;
  delete from public.m3_cv_documents where id = 'a1111111-0000-0000-0000-000000000001';
  select count(*) into n from public.m3_interviews; if n <> 0 then raise exception 'Xóa CV không cascade interview'; end if;
  select count(*) into n from public.m3_messages; if n <> 0 then raise exception 'Xóa CV không cascade tin nhắn'; end if;
  select count(*) into n from public.m3_evaluations; if n <> 0 then raise exception 'Xóa CV không cascade đánh giá'; end if;
end $$;
\echo OK: xóa CV xóa luôn interview, tin nhắn, đánh giá liên quan

reset role;
-- ── Dọn dữ liệu hết hạn ──
update public.m3_cv_documents set expires_at = now() - interval '1 day' where id = 'b2222222-0000-0000-0000-000000000002';
select * from public.m3_purge_expired();
do $$ declare n int; begin select count(*) into n from public.m3_cv_documents; if n <> 0 then raise exception 'purge không xóa dữ liệu hết hạn'; end if; end $$;
\echo OK: m3_purge_expired xóa dữ liệu hết hạn

-- ── Idempotent: chạy lại migration không lỗi (kiểm tra ở bước ngoài) ──
\echo ALL RLS TESTS PASSED
