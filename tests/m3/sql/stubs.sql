-- Stub tối thiểu để chạy migration Module 3 v2 trên Postgres thuần (CHỈ dùng cho kiểm thử cục bộ).
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key default gen_random_uuid());
create or replace function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

create schema if not exists storage;
create table if not exists storage.buckets (id text primary key, name text, public boolean default false, file_size_limit bigint);
create table if not exists storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create or replace function storage.foldername(name text) returns text[] language sql immutable as
  $$ select string_to_array(name, '/') $$;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
end $$;

create table if not exists public.interview_sessions_v2 (id uuid primary key default gen_random_uuid());
create or replace function public.set_updated_at() returns trigger language plpgsql as
  $$ begin new.updated_at = now(); return new; end; $$;

grant usage on schema public, auth, storage to authenticated, anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, delete on storage.objects to authenticated;
