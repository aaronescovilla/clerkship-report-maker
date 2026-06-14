-- Clerkship app — Postgres schema with Row-Level Security for Supabase.
-- Model: cases are PRIVATE BY DEFAULT (owner-only). Explicit per-case shares grant
-- read (or edit) to specific users. An append-only audit log records access to
-- identifiable data. Apply in the Supabase SQL editor.

-- ---- profiles (mirrors auth.users) ----
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

-- ---- cases ----
create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  specialty text not null default 'pediatrics',
  complaint_id text not null,
  complaint_label text not null,
  deidentified boolean not null default true,
  -- The full CaseRecord (header, answers, timeline, pe, narrative, report) as JSONB.
  -- Identifiable fields live under header only when deidentified = false.
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cases_owner_idx on public.cases(owner_id);

-- ---- case_shares ----
create table if not exists public.case_shares (
  case_id uuid not null references public.cases(id) on delete cascade,
  shared_with uuid not null references auth.users(id) on delete cascade,
  can_edit boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (case_id, shared_with)
);

-- ---- cached AI-generated question sets (curated sets live in code) ----
create table if not exists public.question_sets (
  complaint_id text primary key,
  specialty text not null default 'pediatrics',
  set jsonb not null,
  created_at timestamptz not null default now()
);

-- ---- audit log (append-only) ----
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor uuid references auth.users(id),
  action text not null,            -- e.g. 'view','export','share','deidentified_off'
  case_id uuid references public.cases(id) on delete set null,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- =========================== RLS ===========================
alter table public.profiles enable row level security;
alter table public.cases enable row level security;
alter table public.case_shares enable row level security;
alter table public.audit_log enable row level security;

-- profiles: a user sees/edits only their own profile row.
create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- helper: is the current user allowed to read a case?
create or replace function public.can_read_case(c public.cases) returns boolean
language sql stable as $$
  select c.owner_id = auth.uid()
      or exists (select 1 from public.case_shares s where s.case_id = c.id and s.shared_with = auth.uid());
$$;

-- cases: owner full access; shared users read (and edit if can_edit).
create policy "cases select" on public.cases
  for select using (public.can_read_case(cases));
create policy "cases insert" on public.cases
  for insert with check (owner_id = auth.uid());
create policy "cases update" on public.cases
  for update using (
    owner_id = auth.uid()
    or exists (select 1 from public.case_shares s where s.case_id = id and s.shared_with = auth.uid() and s.can_edit)
  );
create policy "cases delete" on public.cases
  for delete using (owner_id = auth.uid());

-- case_shares: only the case owner manages shares; sharee can see their own grant.
create policy "shares owner manage" on public.case_shares
  for all using (exists (select 1 from public.cases c where c.id = case_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from public.cases c where c.id = case_id and c.owner_id = auth.uid()));
create policy "shares sharee read" on public.case_shares
  for select using (shared_with = auth.uid());

-- audit_log: users may insert their own actions; reads restricted to the case owner.
create policy "audit insert own" on public.audit_log
  for insert with check (actor = auth.uid());
create policy "audit owner read" on public.audit_log
  for select using (
    case_id is null and actor = auth.uid()
    or exists (select 1 from public.cases c where c.id = case_id and c.owner_id = auth.uid())
  );

-- question_sets cache is readable by all authenticated users; writes via service role only.
alter table public.question_sets enable row level security;
create policy "qset read" on public.question_sets for select using (auth.role() = 'authenticated');

-- keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists cases_touch on public.cases;
create trigger cases_touch before update on public.cases
  for each row execute function public.touch_updated_at();
