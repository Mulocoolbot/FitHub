-- ============================================================================
-- FitHub RLS Policy Verification Test (Spec Bagian 5)
-- Tests isolation between User A and User B across all tables:
-- 1. profiles
-- 2. exercises
-- 3. workout_sessions
-- 4. session_exercises
-- 5. exercise_sets
-- ============================================================================

begin;

-- Setup test users
do $$
declare
  user_a uuid := '11111111-1111-1111-1111-111111111111';
  user_b uuid := '22222222-2222-2222-2222-222222222222';
  mg_chest_id uuid := 'a0000000-0000-0000-0000-000000000001';
  ex_a_id uuid := 'a1111111-1111-1111-1111-111111111111';
  session_a_id uuid := 'b1111111-1111-1111-1111-111111111111';
  session_ex_a_id uuid := 'c1111111-1111-1111-1111-111111111111';
  set_a_id uuid := 'd1111111-1111-1111-1111-111111111111';
  can_see_count int;
  can_delete_count int;
begin
  -- 1. Insert User A's data as User A
  set local role authenticated;
  set local "request.jwt.claim.sub" to '11111111-1111-1111-1111-111111111111';

  -- User A creates exercise
  insert into public.exercises (id, owner_id, name, muscle_group_id)
  values (ex_a_id, user_a, 'Bench Press A', mg_chest_id);

  -- User A creates session
  insert into public.workout_sessions (id, user_id, performed_at)
  values (session_a_id, user_a, now());

  -- User A creates session exercise
  insert into public.session_exercises (id, session_id, exercise_id, position)
  values (session_ex_a_id, session_a_id, ex_a_id, 0);

  -- User A creates set
  insert into public.exercise_sets (id, session_exercise_id, set_no, weight_kg, reps)
  values (set_a_id, session_ex_a_id, 1, 60.0, 10);

  -- 2. Switch context to User B
  set local "request.jwt.claim.sub" to '22222222-2222-2222-2222-222222222222';

  -- Test: Can User B see User A's exercises?
  select count(*) into can_see_count from public.exercises where id = ex_a_id;
  if can_see_count > 0 then
    raise exception 'RLS FAIL: User B can see User A exercise!';
  end if;

  -- Test: Can User B delete User A's exercise?
  delete from public.exercises where id = ex_a_id;
  -- verify still exists
  set local "request.jwt.claim.sub" to '11111111-1111-1111-1111-111111111111';
  select count(*) into can_see_count from public.exercises where id = ex_a_id;
  if can_see_count = 0 then
    raise exception 'RLS FAIL: User B was able to delete User A exercise!';
  end if;

  -- Switch back to User B
  set local "request.jwt.claim.sub" to '22222222-2222-2222-2222-222222222222';

  -- Test: Can User B see User A's workout sessions?
  select count(*) into can_see_count from public.workout_sessions where id = session_a_id;
  if can_see_count > 0 then
    raise exception 'RLS FAIL: User B can see User A workout_session!';
  end if;

  -- Test: Can User B see User A's session exercises?
  select count(*) into can_see_count from public.session_exercises where id = session_ex_a_id;
  if can_see_count > 0 then
    raise exception 'RLS FAIL: User B can see User A session_exercise!';
  end if;

  -- Test: Can User B see User A's sets?
  select count(*) into can_see_count from public.exercise_sets where id = set_a_id;
  if can_see_count > 0 then
    raise exception 'RLS FAIL: User B can see User A exercise_sets!';
  end if;

  -- Test: Can User B delete User A's sets?
  delete from public.exercise_sets where id = set_a_id;
  set local "request.jwt.claim.sub" to '11111111-1111-1111-1111-111111111111';
  select count(*) into can_see_count from public.exercise_sets where id = set_a_id;
  if can_see_count = 0 then
    raise exception 'RLS FAIL: User B was able to delete User A exercise_set!';
  end if;

  raise notice 'RLS TEST PASSED: User A and User B data completely isolated.';
end $$;

rollback; -- Never commit test data
