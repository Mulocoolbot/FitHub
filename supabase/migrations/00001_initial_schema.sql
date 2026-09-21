-- ============================================================================
-- FitHub Database Schema
-- Migration: 00001_initial_schema
-- All weights stored in kilograms; conversion to lbs in presentation layer only.
-- ============================================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "pg_trgm";

-- ─── Profiles ────────────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  unit_pref   text not null default 'kg'
              check (unit_pref in ('kg', 'lb')),
  timezone    text not null default 'Asia/Jakarta',
  created_at  timestamptz not null default now()
);

comment on table public.profiles is 'User profile data, linked 1:1 to auth.users';

-- ─── Muscle Groups (system reference, read-only for users) ──────────────────
create table public.muscle_groups (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  region      text not null
              check (region in ('chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'other')),
  sort_order  int not null
);

comment on table public.muscle_groups is 'System reference table for muscle groups. Modified only via migrations.';

-- ─── Exercises (ALL user-created, no built-in catalog) ──────────────────────
create table public.exercises (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references auth.users(id) on delete cascade,
  name                text not null,
  muscle_group_id     uuid not null references public.muscle_groups(id),
  secondary_group_ids uuid[] default '{}',
  equipment           text,
  note                text,
  archived_at         timestamptz,
  created_at          timestamptz not null default now()
);

comment on table public.exercises is 'Exercise library. Every exercise belongs to a user (owner_id). No built-in catalog.';

-- Case-insensitive unique constraint per user
create unique index uniq_exercise_name_per_user
  on public.exercises (owner_id, lower(trim(name)));

-- ─── Workout Sessions ───────────────────────────────────────────────────────
create table public.workout_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  performed_at timestamptz not null,
  duration_sec int,
  note         text,
  created_at   timestamptz not null default now()
);

comment on table public.workout_sessions is 'One gym visit / workout session';

-- ─── Session Exercises ───────────────────────────────────────────────────────
create table public.session_exercises (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  position    int not null
);

comment on table public.session_exercises is 'Which exercises were performed in a session, in order';

-- ─── Exercise Sets ───────────────────────────────────────────────────────────
create table public.exercise_sets (
  id                  uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references public.session_exercises(id) on delete cascade,
  set_no              int not null,
  weight_kg           numeric(6,2) not null check (weight_kg >= 0),
  reps                int not null check (reps > 0),
  rpe                 numeric(3,1) check (rpe is null or (rpe >= 1 and rpe <= 10)),
  is_warmup           boolean not null default false
);

comment on table public.exercise_sets is 'Individual sets within an exercise in a session';

-- ─── Indexes ─────────────────────────────────────────────────────────────────
create index idx_workout_sessions_user_date
  on public.workout_sessions (user_id, performed_at desc);

create index idx_session_exercises_session
  on public.session_exercises (session_id);

create index idx_exercise_sets_session_ex
  on public.exercise_sets (session_exercise_id);

create index idx_exercises_owner_active
  on public.exercises (owner_id) where archived_at is null;

create index idx_exercises_muscle_group
  on public.exercises (muscle_group_id);

-- GIN trigram index for fuzzy duplicate detection
create index idx_exercises_name_trgm
  on public.exercises using gin (lower(name) gin_trgm_ops);

-- ─── Auto-create profile on sign-up ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', null));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
