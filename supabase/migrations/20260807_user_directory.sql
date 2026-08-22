-- ============================================================
-- user_directory — bản sao mỏng, chỉ đọc của auth.users trong schema
-- public, đồng bộ qua trigger. Lý do: PostgREST không expose schema
-- auth, nên Back Office phải quét Admin API theo trang (tối đa ~2000
-- user/lượt) để tìm user theo email — chậm dần khi userbase lớn.
-- Bảng này cho phép query trực tiếp bằng SQL thật (ILIKE, COUNT, ...).
-- Không có policy công khai; chỉ service-role đọc.
-- ============================================================
create table if not exists public.user_directory (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  email           text,
  created_at      timestamptz not null,
  last_sign_in_at timestamptz
);

create index if not exists user_directory_email_idx on public.user_directory (lower(email));
create index if not exists user_directory_created_at_idx on public.user_directory (created_at);

alter table public.user_directory enable row level security;
-- Cố ý không tạo policy nào.

-- Backfill user đã tồn tại trước khi có trigger.
insert into public.user_directory (user_id, email, created_at, last_sign_in_at)
select id, email, created_at, last_sign_in_at from auth.users
on conflict (user_id) do update
  set email = excluded.email,
      last_sign_in_at = excluded.last_sign_in_at;

-- Đồng bộ tiếp mỗi khi có user mới hoặc user đăng nhập lại (last_sign_in_at đổi).
create or replace function public.sync_user_directory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_directory (user_id, email, created_at, last_sign_in_at)
  values (new.id, new.email, new.created_at, new.last_sign_in_at)
  on conflict (user_id) do update
    set email = excluded.email,
        last_sign_in_at = excluded.last_sign_in_at;
  return new;
end;
$$;

drop trigger if exists on_auth_user_upsert on auth.users;
create trigger on_auth_user_upsert
  after insert or update on auth.users
  for each row execute function public.sync_user_directory();
