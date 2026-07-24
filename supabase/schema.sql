-- ============================================================================
-- Presensi Anugerah — Supabase schema
-- Run this in your project's SQL Editor (Supabase Dashboard → SQL → New query).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS.
-- ============================================================================

-- Sequential employee numbers: AII001, AII002, AII003, …
create sequence if not exists public.employee_id_seq start 1;

-- Formats the next employee id as AII + zero-padded number (min 3 digits).
create or replace function public.next_employee_id()
returns text
language sql
volatile
as $$
  select 'AII' || lpad(nextval('public.employee_id_seq')::text, 3, '0');
$$;

-- ── profiles ────────────────────────────────────────────────────────────────
-- One row per employee, keyed to the Supabase auth user.
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  full_name    text not null default '',
  employee_id  text unique,
  department   text,
  role         text not null default 'employee' check (role in ('employee', 'admin')),
  shift        text,
  created_at   timestamptz not null default now()
);

-- ── attendance ──────────────────────────────────────────────────────────────
-- One row per employee per calendar day (work_date). Clock-out fills in later.
create table if not exists public.attendance (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  work_date      date not null,
  clock_in_at    timestamptz,
  clock_in_lat   double precision,
  clock_in_lng   double precision,
  clock_out_at   timestamptz,
  clock_out_lat  double precision,
  clock_out_lng  double precision,
  clock_in_photo  text,               -- storage object path of the clock-in selfie
  clock_out_photo text,               -- storage object path of the clock-out selfie
  created_at     timestamptz not null default now(),
  unique (user_id, work_date)          -- lets the app upsert on (user_id, work_date)
);

-- Add the photo columns to an already-created table (safe to re-run).
alter table public.attendance add column if not exists clock_in_photo  text;
alter table public.attendance add column if not exists clock_out_photo text;

create index if not exists attendance_user_date_idx on public.attendance (user_id, work_date desc);

-- ── auto-create a profile when a user signs up ──────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, employee_id, department)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    -- honour an explicit id if one was passed, otherwise auto-number AII001, AII002, …
    coalesce(new.raw_user_meta_data ->> 'employee_id', public.next_employee_id()),
    new.raw_user_meta_data ->> 'department'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── admin check (SECURITY DEFINER avoids RLS recursion on profiles) ─────────
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- ── Row-Level Security ──────────────────────────────────────────────────────
alter table public.profiles   enable row level security;
alter table public.attendance enable row level security;

-- profiles: read your own; admins read everyone. Update your own basic fields.
drop policy if exists "profiles read own"   on public.profiles;
drop policy if exists "profiles read admin" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;

create policy "profiles read own"   on public.profiles for select using (auth.uid() = id);
create policy "profiles read admin" on public.profiles for select using (public.is_admin());
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);

-- attendance: full control over your own rows; admins can read all.
-- A single FOR ALL policy (USING + WITH CHECK) is required so that upsert
-- (INSERT ... ON CONFLICT DO UPDATE) satisfies both the insert and update paths.
drop policy if exists "attendance select own"   on public.attendance;
drop policy if exists "attendance select admin" on public.attendance;
drop policy if exists "attendance insert own"   on public.attendance;
drop policy if exists "attendance update own"   on public.attendance;
drop policy if exists "attendance all own"      on public.attendance;

create policy "attendance all own" on public.attendance
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "attendance select admin" on public.attendance
  for select using (public.is_admin());

-- ── shifts ──────────────────────────────────────────────────────────────────
-- Work-shift options managed by admins; everyone can read them for dropdowns.
create table if not exists public.shifts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  start_time  text not null,   -- "08:30"
  end_time    text not null,   -- "17:30"
  created_at  timestamptz not null default now()
);

alter table public.shifts enable row level security;

drop policy if exists "shifts read all"   on public.shifts;
drop policy if exists "shifts write admin" on public.shifts;
create policy "shifts read all"   on public.shifts for select to authenticated using (true);
create policy "shifts write admin" on public.shifts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Seed one default shift if the table is empty.
insert into public.shifts (name, start_time, end_time)
select 'Reguler', '08:30', '17:30'
where not exists (select 1 from public.shifts);

-- ── Storage: selfie photos ──────────────────────────────────────────────────
-- Private bucket; objects live under {user_id}/... so RLS scopes each user to
-- their own folder. Admins can read everyone's photos.
insert into storage.buckets (id, name, public)
values ('attendance-photos', 'attendance-photos', false)
on conflict (id) do nothing;

drop policy if exists "att photos all own"      on storage.objects;
drop policy if exists "att photos select admin" on storage.objects;

create policy "att photos all own" on storage.objects
  for all to authenticated
  using (bucket_id = 'attendance-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'attendance-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "att photos select admin" on storage.objects
  for select to authenticated
  using (bucket_id = 'attendance-photos' and public.is_admin());

-- ============================================================================
-- After the first user signs up, promote them to admin (run once, replace email):
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'you@anugerah.ai');
-- ============================================================================
