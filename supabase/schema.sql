-- ============================================================================
-- Presensi Anugerah — Supabase schema
-- Run this in your project's SQL Editor (Supabase Dashboard → SQL → New query).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS.
-- ============================================================================

-- Sequential employee numbers: AII001, AII002, AII003, …
-- Derived from the highest existing employee_id (not a sequence) so that failed
-- or deleted account attempts don't permanently burn numbers / cause gaps.
create or replace function public.next_employee_id()
returns text
language sql
volatile
as $$
  select 'AII' || lpad(
    (coalesce(max(nullif(regexp_replace(employee_id, '\D', '', 'g'), ''))::int, 0) + 1)::text,
    3, '0')
  from public.profiles
  where employee_id ~ '^AII[0-9]+$';
$$;

-- ── profiles ────────────────────────────────────────────────────────────────
-- One row per employee, keyed to the Supabase auth user.
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  full_name    text not null default '',
  email        text,
  employee_id  text unique,
  department   text,
  role         text not null default 'employee' check (role in ('employee', 'admin')),
  shift        text,
  created_at   timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists birth_date date;

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
  insert into public.profiles (id, full_name, email, employee_id, department, join_date)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    -- honour an explicit id if one was passed, otherwise auto-number AII001, AII002, …
    coalesce(new.raw_user_meta_data ->> 'employee_id', public.next_employee_id()),
    new.raw_user_meta_data ->> 'department',
    -- leave accrual starts the day the account is created (admin can adjust later)
    coalesce((new.raw_user_meta_data ->> 'join_date')::date, current_date)
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
drop policy if exists "profiles read own"    on public.profiles;
drop policy if exists "profiles read admin"  on public.profiles;
drop policy if exists "profiles update own"  on public.profiles;
drop policy if exists "profiles update admin" on public.profiles;

create policy "profiles read own"    on public.profiles for select using (auth.uid() = id);
create policy "profiles read admin"  on public.profiles for select using (public.is_admin());
create policy "profiles update own"  on public.profiles for update using (auth.uid() = id);
create policy "profiles update admin" on public.profiles for update using (public.is_admin()) with check (public.is_admin());

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

-- ── leave / permission requests ──────────────────────────────────────────────
-- One row per request. Lifecycle: pending → approved | rejected | cancelled.
-- Types mirror the reference diagram: cuti_tahunan / sakit / izin / dinas_luar.
-- Only approved `cuti_tahunan` consumes annual-leave quota. The balance is
-- DERIVED, not stored: annual leave accrues +1 day per completed month since
-- `join_date` (capped at 12 per service year); any unused balance from the
-- previous service year carries over but expires 6 months into the new one.
-- `leave_quota_adjust` is an admin correction (+/- days). Cancelling an approved
-- request automatically restores the balance — no counter to keep in sync.
alter table public.profiles
  add column if not exists join_date date,
  add column if not exists leave_quota_adjust int not null default 0,
  -- excluded people (e.g. the founder) still appear in the directory and can
  -- clock in, but are left out of every statistic (attendance rate, leave stats,
  -- dashboard headline counts).
  add column if not exists exclude_from_stats boolean not null default false,
  -- deprecated: superseded by join_date accrual + leave_quota_adjust; kept to
  -- avoid breaking older clients. No longer read by the app.
  add column if not exists annual_leave_quota int not null default 12;

-- Backfill join_date for existing employees from their account creation date.
update public.profiles set join_date = created_at::date where join_date is null;

-- The founder (Monthy = AII001) is everyone's manager — keep them out of the
-- stats. Keyed by employee_id, not name. (Adjustable per person in the admin UI.)
update public.profiles set exclude_from_stats = true where employee_id = 'AII001';

-- btree_gist lets the overlap guard combine `user_id =` with a range `&&`.
create extension if not exists btree_gist;

create table if not exists public.leave_requests (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  type           text not null check (type in ('cuti_tahunan', 'sakit', 'unpaid_leave', 'dinas_luar')),
  start_date     date not null,
  end_date       date not null,
  days           int  not null default 1 check (days >= 1),  -- working days, computed by the app
  reason         text,
  attachment_path text,                                      -- storage object path (optional, e.g. surat dokter)
  status         text not null default 'pending'
                   check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  review_note    text,
  reviewed_by    uuid references auth.users (id),
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists leave_user_idx   on public.leave_requests (user_id, start_date desc);
create index if not exists leave_status_idx on public.leave_requests (status, start_date desc);

-- Rename the legacy 'izin' type to 'unpaid_leave' (UI now reads "Unpaid leave").
-- Idempotent: refresh the type check constraint and migrate any old rows.
alter table public.leave_requests drop constraint if exists leave_requests_type_check;
update public.leave_requests set type = 'unpaid_leave' where type = 'izin';
alter table public.leave_requests add constraint leave_requests_type_check
  check (type in ('cuti_tahunan', 'sakit', 'unpaid_leave', 'dinas_luar'));

-- No overlapping *active* (pending/approved) requests for the same employee.
alter table public.leave_requests drop constraint if exists leave_no_overlap;
alter table public.leave_requests add constraint leave_no_overlap
  exclude using gist (
    user_id with =,
    daterange(start_date, end_date, '[]') with &&
  ) where (status in ('pending', 'approved'));

-- Guard status transitions in the DB so RLS doesn't have to be column-aware:
--   • → approved / rejected : admins only (records reviewer + timestamp)
--   • → cancelled           : the owner, and if it was approved only before it starts
--   • pending row edits      : the owner may still change dates/reason while pending
create or replace function public.enforce_leave_transition()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if new.status in ('approved', 'rejected') then
      if not public.is_admin() then
        raise exception 'Only an admin can approve or reject a request';
      end if;
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
    elsif new.status = 'cancelled' then
      if auth.uid() <> old.user_id then
        raise exception 'Only the owner can cancel their request';
      end if;
      if old.status not in ('pending', 'approved') then
        raise exception 'Only a pending or approved request can be cancelled';
      end if;
      if old.status = 'approved' and old.start_date <= current_date then
        raise exception 'An approved leave cannot be cancelled once it has started';
      end if;
    else
      raise exception 'Illegal status transition % → %', old.status, new.status;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_leave_update on public.leave_requests;
create trigger on_leave_update
  before update on public.leave_requests
  for each row execute function public.enforce_leave_transition();

alter table public.leave_requests enable row level security;

drop policy if exists "leave read own"    on public.leave_requests;
drop policy if exists "leave read admin"  on public.leave_requests;
drop policy if exists "leave insert own"  on public.leave_requests;
drop policy if exists "leave update own"  on public.leave_requests;
drop policy if exists "leave update admin" on public.leave_requests;

-- Employees: read + create + update (cancel) their own; new rows must be pending.
create policy "leave read own"   on public.leave_requests for select using (auth.uid() = user_id);
create policy "leave insert own" on public.leave_requests for insert
  with check (auth.uid() = user_id and status = 'pending');
create policy "leave update own" on public.leave_requests for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Admins: read everyone; approve/reject (transition guarded by the trigger above).
create policy "leave read admin"   on public.leave_requests for select using (public.is_admin());
create policy "leave update admin" on public.leave_requests for update
  using (public.is_admin()) with check (public.is_admin());

-- ── Storage: leave attachments (surat dokter, dsb.) ──────────────────────────
insert into storage.buckets (id, name, public)
values ('leave-attachments', 'leave-attachments', false)
on conflict (id) do nothing;

drop policy if exists "leave att all own"      on storage.objects;
drop policy if exists "leave att select admin" on storage.objects;

create policy "leave att all own" on storage.objects
  for all to authenticated
  using (bucket_id = 'leave-attachments' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'leave-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "leave att select admin" on storage.objects
  for select to authenticated
  using (bucket_id = 'leave-attachments' and public.is_admin());

-- Realtime: let employees receive live status changes (approve/reject) on their
-- own requests. RLS still applies, so a client only ever sees its own rows.
do $$
begin
  alter publication supabase_realtime add table public.leave_requests;
exception
  when duplicate_object then null;  -- already added; safe to re-run
end $$;

-- ── holidays ─────────────────────────────────────────────────────────────────
-- National holidays + company days off. Attendance and leave logic treat these
-- like weekends: they don't consume leave quota and employees aren't expected to
-- clock in. Managed by admins; everyone can read them.
create table if not exists public.holidays (
  holiday_date date primary key,
  name         text not null,
  created_at   timestamptz not null default now()
);

alter table public.holidays enable row level security;

drop policy if exists "holidays read all"   on public.holidays;
drop policy if exists "holidays write admin" on public.holidays;
create policy "holidays read all"   on public.holidays for select to authenticated using (true);
create policy "holidays write admin" on public.holidays for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Seed Indonesia's 2026 national holidays — only if the table is empty, so admin
-- edits/deletions persist across re-runs. NOTE: religious/lunar dates are best-
-- effort and should be verified against the official SKB 3 Menteri; the admin
-- can add/edit/remove any of these (incl. cuti bersama) from the app.
insert into public.holidays (holiday_date, name)
select d::date, n from (values
  ('2026-01-01', 'Tahun Baru Masehi 2026'),
  ('2026-02-17', 'Tahun Baru Imlek 2577'),
  ('2026-03-19', 'Hari Suci Nyepi (Tahun Baru Saka 1948)'),
  ('2026-03-20', 'Idul Fitri 1447 H'),
  ('2026-03-21', 'Idul Fitri 1447 H (Hari Kedua)'),
  ('2026-04-03', 'Wafat Isa Almasih'),
  ('2026-05-01', 'Hari Buruh Internasional'),
  ('2026-05-14', 'Kenaikan Isa Almasih'),
  ('2026-05-27', 'Idul Adha 1447 H'),
  ('2026-05-31', 'Hari Raya Waisak 2570'),
  ('2026-06-01', 'Hari Lahir Pancasila'),
  ('2026-06-16', 'Tahun Baru Islam 1448 H'),
  ('2026-08-17', 'Hari Kemerdekaan RI'),
  ('2026-08-25', 'Maulid Nabi Muhammad SAW'),
  ('2026-12-25', 'Hari Raya Natal')
) as v(d, n)
where not exists (select 1 from public.holidays);

-- ── Home feed (social carousel): new joiners, birthdays, on-leave today ──────
-- SECURITY DEFINER so any authenticated employee can see these team highlights
-- without granting broad read access to everyone's profile. Returns only the
-- name + role + kind needed for the cards — no birth year, join date, etc.
create or replace function public.home_feed()
returns table (kind text, name text, role text)
language sql
security definer set search_path = public
stable
as $$
  -- New joiners — visible for the first 3 days (join day + 2)
  select 'welcome'::text, full_name, department
  from public.profiles
  where join_date is not null and join_date between current_date - 2 and current_date
  union all
  -- Birthdays today (match month + day, any year)
  select 'birthday'::text, full_name, null::text
  from public.profiles
  where birth_date is not null
    and to_char(birth_date, 'MM-DD') = to_char(current_date, 'MM-DD')
  union all
  -- On approved leave that covers today
  select 'leave'::text, p.full_name, null::text
  from public.leave_requests lr
  join public.profiles p on p.id = lr.user_id
  where lr.status = 'approved'
    and lr.start_date <= current_date
    and lr.end_date >= current_date;
$$;

grant execute on function public.home_feed() to authenticated;

-- ============================================================================
-- After the first user signs up, promote them to admin (run once, replace email):
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'you@anugerah.ai');
-- ============================================================================
