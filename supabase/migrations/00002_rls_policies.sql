-- ============================================================================
-- FitHub Row Level Security Policies
-- Migration: 00002_rls_policies
-- RLS is enabled on ALL tables. No exceptions.
-- ============================================================================

-- ─── Enable RLS ──────────────────────────────────────────────────────────────
alter table public.profiles         enable row level security;
alter table public.muscle_groups    enable row level security;
alter table public.exercises        enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.session_exercises enable row level security;
alter table public.exercise_sets    enable row level security;

-- ─── Profiles ────────────────────────────────────────────────────────────────
-- User can only read and update their own profile
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Insert handled by trigger; users should not insert directly
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ─── Muscle Groups (system reference, read-only) ────────────────────────────
-- All authenticated users can read; no insert/update/delete policies
create policy "muscle_groups_select_authenticated"
  on public.muscle_groups for select
  using (auth.role() = 'authenticated');

-- ─── Exercises ───────────────────────────────────────────────────────────────
-- All operations restricted to owner. No built-in exercises (no owner_id is null exception).
create policy "exercises_select_own"
  on public.exercises for select
  using (owner_id = auth.uid());

create policy "exercises_insert_own"
  on public.exercises for insert
  with check (owner_id = auth.uid());

create policy "exercises_update_own"
  on public.exercises for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "exercises_delete_own"
  on public.exercises for delete
  using (owner_id = auth.uid());

-- ─── Workout Sessions ───────────────────────────────────────────────────────
-- All operations restricted to session owner
create policy "workout_sessions_select_own"
  on public.workout_sessions for select
  using (auth.uid() = user_id);

create policy "workout_sessions_insert_own"
  on public.workout_sessions for insert
  with check (auth.uid() = user_id);

create policy "workout_sessions_update_own"
  on public.workout_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "workout_sessions_delete_own"
  on public.workout_sessions for delete
  using (auth.uid() = user_id);

-- ─── Session Exercises ───────────────────────────────────────────────────────
-- No user_id column; must traverse to workout_sessions.user_id via subquery
create policy "session_exercises_select_own"
  on public.session_exercises for select
  using (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_exercises.session_id
        and ws.user_id = auth.uid()
    )
  );

create policy "session_exercises_insert_own"
  on public.session_exercises for insert
  with check (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_exercises.session_id
        and ws.user_id = auth.uid()
    )
  );

create policy "session_exercises_update_own"
  on public.session_exercises for update
  using (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_exercises.session_id
        and ws.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_exercises.session_id
        and ws.user_id = auth.uid()
    )
  );

create policy "session_exercises_delete_own"
  on public.session_exercises for delete
  using (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_exercises.session_id
        and ws.user_id = auth.uid()
    )
  );

-- ─── Exercise Sets ───────────────────────────────────────────────────────────
-- No user_id column; must traverse session_exercises → workout_sessions.user_id
create policy "exercise_sets_select_own"
  on public.exercise_sets for select
  using (
    exists (
      select 1 from public.session_exercises se
      join public.workout_sessions ws on ws.id = se.session_id
      where se.id = exercise_sets.session_exercise_id
        and ws.user_id = auth.uid()
    )
  );

create policy "exercise_sets_insert_own"
  on public.exercise_sets for insert
  with check (
    exists (
      select 1 from public.session_exercises se
      join public.workout_sessions ws on ws.id = se.session_id
      where se.id = exercise_sets.session_exercise_id
        and ws.user_id = auth.uid()
    )
  );

create policy "exercise_sets_update_own"
  on public.exercise_sets for update
  using (
    exists (
      select 1 from public.session_exercises se
      join public.workout_sessions ws on ws.id = se.session_id
      where se.id = exercise_sets.session_exercise_id
        and ws.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.session_exercises se
      join public.workout_sessions ws on ws.id = se.session_id
      where se.id = exercise_sets.session_exercise_id
        and ws.user_id = auth.uid()
    )
  );

create policy "exercise_sets_delete_own"
  on public.exercise_sets for delete
  using (
    exists (
      select 1 from public.session_exercises se
      join public.workout_sessions ws on ws.id = se.session_id
      where se.id = exercise_sets.session_exercise_id
        and ws.user_id = auth.uid()
    )
  );
