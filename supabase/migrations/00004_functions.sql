-- ============================================================================
-- FitHub Database Functions
-- Migration: 00004_functions
-- Includes:
-- 1. find_similar_exercises (fuzzy match via pg_trgm similarity > 0.4)
-- 2. merge_exercises (atomic merge of duplicate exercises)
-- 3. get_exercise_progress (e1RM Epley calculation + lag window function)
-- ============================================================================

-- ─── 1. Fuzzy Exercise Matching ─────────────────────────────────────────────
create or replace function public.find_similar_exercises(
  p_user_id uuid,
  p_name text
)
returns table (
  id uuid,
  name text,
  similarity float
)
language sql
stable
security invoker
as $$
  select
    e.id,
    e.name,
    similarity(lower(trim(e.name)), lower(trim(p_name)))::float as similarity
  from public.exercises e
  where e.owner_id = p_user_id
    and e.archived_at is null
    and similarity(lower(trim(e.name)), lower(trim(p_name))) > 0.4
  order by similarity desc
  limit 5;
$$;

comment on function public.find_similar_exercises is 'Find exercises owned by user with trigram similarity > 0.4 to prevent duplicates';

-- ─── 2. Merge Duplicate Exercises ───────────────────────────────────────────
create or replace function public.merge_exercises(
  p_source_id uuid,
  p_target_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
begin
  -- Ensure both exercises exist and belong to the authenticated user
  if not exists (select 1 from public.exercises where id = p_source_id and owner_id = v_user_id) or
     not exists (select 1 from public.exercises where id = p_target_id and owner_id = v_user_id) then
    raise exception 'Unauthorized or exercise not found';
  end if;

  if p_source_id = p_target_id then
    raise exception 'Cannot merge exercise with itself';
  end if;

  -- Reassign all session_exercises from source to target
  update public.session_exercises
  set exercise_id = p_target_id
  where exercise_id = p_source_id;

  -- Soft-delete / archive the source exercise
  update public.exercises
  set archived_at = now()
  where id = p_source_id;
end;
$$;

comment on function public.merge_exercises is 'Atomically moves session_exercises from source to target and archives source';

-- ─── 3. Exercise Progress Calculation ───────────────────────────────────────
create or replace function public.get_exercise_progress(
  p_user_id uuid,
  p_period text default 'week'
)
returns table (
  exercise_id uuid,
  exercise_name text,
  period_start timestamptz,
  best_e1rm numeric,
  total_volume numeric,
  session_count bigint,
  prev_period_start timestamptz,
  prev_best_e1rm numeric,
  prev_total_volume numeric,
  delta_e1rm_pct numeric,
  status text
)
language plpgsql
stable
security invoker
as $$
declare
  v_tz text;
begin
  -- Fetch user timezone from profiles, default to Asia/Jakarta
  select coalesce(timezone, 'Asia/Jakarta') into v_tz
  from public.profiles
  where id = p_user_id;

  if v_tz is null then
    v_tz := 'Asia/Jakarta';
  end if;

  return query
  with session_level as (
    select
      ws.id as session_id,
      ws.user_id,
      ws.performed_at,
      date_trunc(p_period, ws.performed_at at time zone v_tz) at time zone v_tz as p_start,
      se.exercise_id,
      e.name as exercise_name,
      es.weight_kg,
      es.reps,
      -- Epley Formula: weight * (1 + reps / 30.0)
      (es.weight_kg * (1.0 + (es.reps::numeric / 30.0))) as e1rm,
      (es.weight_kg * es.reps) as set_volume
    from public.workout_sessions ws
    join public.session_exercises se on se.session_id = ws.id
    join public.exercises e on e.id = se.exercise_id
    join public.exercise_sets es on es.session_exercise_id = se.id
    where ws.user_id = p_user_id
      and es.is_warmup = false
  ),
  period_aggregated as (
    select
      sl.exercise_id,
      sl.exercise_name,
      sl.p_start as period_start,
      round(max(sl.e1rm), 2) as best_e1rm,
      round(sum(sl.set_volume), 2) as total_volume,
      count(distinct sl.session_id) as session_count
    from session_level sl
    group by sl.exercise_id, sl.exercise_name, sl.p_start
  ),
  with_lag as (
    select
      pa.exercise_id,
      pa.exercise_name,
      pa.period_start,
      pa.best_e1rm,
      pa.total_volume,
      pa.session_count,
      lag(pa.period_start) over w as prev_period_start,
      lag(pa.best_e1rm) over w as prev_best_e1rm,
      lag(pa.total_volume) over w as prev_total_volume
    from period_aggregated pa
    window w as (partition by pa.exercise_id order by pa.period_start)
  )
  select
    wl.exercise_id,
    wl.exercise_name,
    wl.period_start,
    wl.best_e1rm,
    wl.total_volume,
    wl.session_count,
    wl.prev_period_start,
    wl.prev_best_e1rm,
    wl.prev_total_volume,
    case
      when wl.prev_best_e1rm is not null and wl.prev_best_e1rm > 0
        then round(((wl.best_e1rm - wl.prev_best_e1rm) / wl.prev_best_e1rm) * 100.0, 2)
      else null
    end as delta_e1rm_pct,
    case
      when wl.prev_best_e1rm is null then 'new'
      -- Mixed: e1RM up (>+2%) but volume down (>10%), or e1RM down (<-2%) but volume up (>10%)
      when (wl.best_e1rm - wl.prev_best_e1rm) / wl.prev_best_e1rm > 0.02
        and wl.prev_total_volume is not null
        and (wl.total_volume - wl.prev_total_volume) / wl.prev_total_volume < -0.10 then 'mixed'
      when (wl.best_e1rm - wl.prev_best_e1rm) / wl.prev_best_e1rm < -0.02
        and wl.prev_total_volume is not null
        and (wl.total_volume - wl.prev_total_volume) / wl.prev_total_volume > 0.10 then 'mixed'
      -- Up / Down / Flat with 2% dead zone
      when (wl.best_e1rm - wl.prev_best_e1rm) / wl.prev_best_e1rm > 0.02 then 'up'
      when (wl.best_e1rm - wl.prev_best_e1rm) / wl.prev_best_e1rm < -0.02 then 'down'
      else 'flat'
    end as status
  from with_lag wl
  order by wl.exercise_name, wl.period_start desc;
end;
$$;

comment on function public.get_exercise_progress is 'Calculates estimated 1RM, volume, and up/down/flat/mixed progress status per exercise';
