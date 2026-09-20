-- ============================================================================
-- FitHub Seed Data: Exercise Catalog
-- Migration: 00003_seed_exercises
-- 60+ common exercises with parent-child variation relationships.
-- owner_id = null means built-in catalog exercise.
-- ============================================================================

-- ─── CHEST ───────────────────────────────────────────────────────────────────
-- Parent: Bench Press
insert into public.exercises (id, name, muscle_group, equipment, parent_id, owner_id)
values
  ('10000000-0000-0000-0000-000000000001', 'Bench Press', 'chest', 'barbell', null, null),
  ('10000000-0000-0000-0000-000000000002', 'Incline Bench Press', 'chest', 'barbell', '10000000-0000-0000-0000-000000000001', null),
  ('10000000-0000-0000-0000-000000000003', 'Decline Bench Press', 'chest', 'barbell', '10000000-0000-0000-0000-000000000001', null),
  ('10000000-0000-0000-0000-000000000004', 'Close-Grip Bench Press', 'chest', 'barbell', '10000000-0000-0000-0000-000000000001', null);

-- Parent: Dumbbell Press
insert into public.exercises (id, name, muscle_group, equipment, parent_id, owner_id)
values
  ('10000000-0000-0000-0000-000000000005', 'Dumbbell Press', 'chest', 'dumbbell', null, null),
  ('10000000-0000-0000-0000-000000000006', 'Incline Dumbbell Press', 'chest', 'dumbbell', '10000000-0000-0000-0000-000000000005', null),
  ('10000000-0000-0000-0000-000000000007', 'Decline Dumbbell Press', 'chest', 'dumbbell', '10000000-0000-0000-0000-000000000005', null);

-- Flyes
insert into public.exercises (id, name, muscle_group, equipment, parent_id, owner_id)
values
  ('10000000-0000-0000-0000-000000000008', 'Dumbbell Fly', 'chest', 'dumbbell', null, null),
  ('10000000-0000-0000-0000-000000000009', 'Incline Dumbbell Fly', 'chest', 'dumbbell', '10000000-0000-0000-0000-000000000008', null),
  ('10000000-0000-0000-0000-000000000010', 'Cable Fly', 'chest', 'cable', '10000000-0000-0000-0000-000000000008', null);

-- Chest machine/other
insert into public.exercises (id, name, muscle_group, equipment, parent_id, owner_id)
values
  ('10000000-0000-0000-0000-000000000011', 'Chest Press Machine', 'chest', 'machine', null, null),
  ('10000000-0000-0000-0000-000000000012', 'Pec Deck', 'chest', 'machine', null, null),
  ('10000000-0000-0000-0000-000000000013', 'Push-Up', 'chest', 'bodyweight', null, null),
  ('10000000-0000-0000-0000-000000000014', 'Dip (Chest)', 'chest', 'bodyweight', null, null);

-- ─── BACK ────────────────────────────────────────────────────────────────────
-- Parent: Row
insert into public.exercises (id, name, muscle_group, equipment, parent_id, owner_id)
values
  ('20000000-0000-0000-0000-000000000001', 'Barbell Row', 'back', 'barbell', null, null),
  ('20000000-0000-0000-0000-000000000002', 'Pendlay Row', 'back', 'barbell', '20000000-0000-0000-0000-000000000001', null),
  ('20000000-0000-0000-0000-000000000003', 'Dumbbell Row', 'back', 'dumbbell', '20000000-0000-0000-0000-000000000001', null),
  ('20000000-0000-0000-0000-000000000004', 'Cable Row', 'back', 'cable', '20000000-0000-0000-0000-000000000001', null),
  ('20000000-0000-0000-0000-000000000005', 'T-Bar Row', 'back', 'barbell', '20000000-0000-0000-0000-000000000001', null);

-- Pull-ups / Lat
insert into public.exercises (id, name, muscle_group, equipment, parent_id, owner_id)
values
  ('20000000-0000-0000-0000-000000000006', 'Pull-Up', 'back', 'bodyweight', null, null),
  ('20000000-0000-0000-0000-000000000007', 'Chin-Up', 'back', 'bodyweight', '20000000-0000-0000-0000-000000000006', null),
  ('20000000-0000-0000-0000-000000000008', 'Lat Pulldown', 'back', 'cable', '20000000-0000-0000-0000-000000000006', null),
  ('20000000-0000-0000-0000-000000000009', 'Close-Grip Lat Pulldown', 'back', 'cable', '20000000-0000-0000-0000-000000000006', null);

-- Deadlift
insert into public.exercises (id, name, muscle_group, equipment, parent_id, owner_id)
values
  ('20000000-0000-0000-0000-000000000010', 'Deadlift', 'back', 'barbell', null, null),
  ('20000000-0000-0000-0000-000000000011', 'Romanian Deadlift', 'back', 'barbell', '20000000-0000-0000-0000-000000000010', null),
  ('20000000-0000-0000-0000-000000000012', 'Sumo Deadlift', 'back', 'barbell', '20000000-0000-0000-0000-000000000010', null);

-- Other back
insert into public.exercises (id, name, muscle_group, equipment, parent_id, owner_id)
values
  ('20000000-0000-0000-0000-000000000013', 'Face Pull', 'back', 'cable', null, null),
  ('20000000-0000-0000-0000-000000000014', 'Shrug', 'back', 'dumbbell', null, null);

-- ─── LEGS ────────────────────────────────────────────────────────────────────
-- Squat
insert into public.exercises (id, name, muscle_group, equipment, parent_id, owner_id)
values
  ('30000000-0000-0000-0000-000000000001', 'Barbell Squat', 'legs', 'barbell', null, null),
  ('30000000-0000-0000-0000-000000000002', 'Front Squat', 'legs', 'barbell', '30000000-0000-0000-0000-000000000001', null),
  ('30000000-0000-0000-0000-000000000003', 'Goblet Squat', 'legs', 'dumbbell', '30000000-0000-0000-0000-000000000001', null),
  ('30000000-0000-0000-0000-000000000004', 'Hack Squat', 'legs', 'machine', '30000000-0000-0000-0000-000000000001', null),
  ('30000000-0000-0000-0000-000000000005', 'Bulgarian Split Squat', 'legs', 'dumbbell', '30000000-0000-0000-0000-000000000001', null);

-- Lunge
insert into public.exercises (id, name, muscle_group, equipment, parent_id, owner_id)
values
  ('30000000-0000-0000-0000-000000000006', 'Lunge', 'legs', 'dumbbell', null, null),
  ('30000000-0000-0000-0000-000000000007', 'Walking Lunge', 'legs', 'dumbbell', '30000000-0000-0000-0000-000000000006', null),
  ('30000000-0000-0000-0000-000000000008', 'Reverse Lunge', 'legs', 'dumbbell', '30000000-0000-0000-0000-000000000006', null);

-- Machine legs
insert into public.exercises (id, name, muscle_group, equipment, parent_id, owner_id)
values
  ('30000000-0000-0000-0000-000000000009', 'Leg Press', 'legs', 'machine', null, null),
  ('30000000-0000-0000-0000-000000000010', 'Leg Extension', 'legs', 'machine', null, null),
  ('30000000-0000-0000-0000-000000000011', 'Leg Curl', 'legs', 'machine', null, null),
  ('30000000-0000-0000-0000-000000000012', 'Calf Raise (Standing)', 'legs', 'machine', null, null),
  ('30000000-0000-0000-0000-000000000013', 'Calf Raise (Seated)', 'legs', 'machine', '30000000-0000-0000-0000-000000000012', null),
  ('30000000-0000-0000-0000-000000000014', 'Hip Thrust', 'legs', 'barbell', null, null);

-- ─── SHOULDERS ───────────────────────────────────────────────────────────────
-- OHP
insert into public.exercises (id, name, muscle_group, equipment, parent_id, owner_id)
values
  ('40000000-0000-0000-0000-000000000001', 'Overhead Press', 'shoulders', 'barbell', null, null),
  ('40000000-0000-0000-0000-000000000002', 'Seated Dumbbell Press', 'shoulders', 'dumbbell', '40000000-0000-0000-0000-000000000001', null),
  ('40000000-0000-0000-0000-000000000003', 'Arnold Press', 'shoulders', 'dumbbell', '40000000-0000-0000-0000-000000000001', null),
  ('40000000-0000-0000-0000-000000000004', 'Machine Shoulder Press', 'shoulders', 'machine', '40000000-0000-0000-0000-000000000001', null);

-- Raises
insert into public.exercises (id, name, muscle_group, equipment, parent_id, owner_id)
values
  ('40000000-0000-0000-0000-000000000005', 'Lateral Raise', 'shoulders', 'dumbbell', null, null),
  ('40000000-0000-0000-0000-000000000006', 'Cable Lateral Raise', 'shoulders', 'cable', '40000000-0000-0000-0000-000000000005', null),
  ('40000000-0000-0000-0000-000000000007', 'Front Raise', 'shoulders', 'dumbbell', null, null),
  ('40000000-0000-0000-0000-000000000008', 'Reverse Fly', 'shoulders', 'dumbbell', null, null),
  ('40000000-0000-0000-0000-000000000009', 'Upright Row', 'shoulders', 'barbell', null, null);

-- ─── ARMS ────────────────────────────────────────────────────────────────────
-- Biceps
insert into public.exercises (id, name, muscle_group, equipment, parent_id, owner_id)
values
  ('50000000-0000-0000-0000-000000000001', 'Barbell Curl', 'arms', 'barbell', null, null),
  ('50000000-0000-0000-0000-000000000002', 'EZ-Bar Curl', 'arms', 'barbell', '50000000-0000-0000-0000-000000000001', null),
  ('50000000-0000-0000-0000-000000000003', 'Dumbbell Curl', 'arms', 'dumbbell', '50000000-0000-0000-0000-000000000001', null),
  ('50000000-0000-0000-0000-000000000004', 'Hammer Curl', 'arms', 'dumbbell', '50000000-0000-0000-0000-000000000001', null),
  ('50000000-0000-0000-0000-000000000005', 'Incline Dumbbell Curl', 'arms', 'dumbbell', '50000000-0000-0000-0000-000000000001', null),
  ('50000000-0000-0000-0000-000000000006', 'Cable Curl', 'arms', 'cable', '50000000-0000-0000-0000-000000000001', null),
  ('50000000-0000-0000-0000-000000000007', 'Preacher Curl', 'arms', 'dumbbell', '50000000-0000-0000-0000-000000000001', null);

-- Triceps
insert into public.exercises (id, name, muscle_group, equipment, parent_id, owner_id)
values
  ('50000000-0000-0000-0000-000000000008', 'Tricep Pushdown', 'arms', 'cable', null, null),
  ('50000000-0000-0000-0000-000000000009', 'Rope Pushdown', 'arms', 'cable', '50000000-0000-0000-0000-000000000008', null),
  ('50000000-0000-0000-0000-000000000010', 'Overhead Tricep Extension', 'arms', 'dumbbell', null, null),
  ('50000000-0000-0000-0000-000000000011', 'Skull Crusher', 'arms', 'barbell', null, null),
  ('50000000-0000-0000-0000-000000000012', 'Dip (Tricep)', 'arms', 'bodyweight', null, null);

-- ─── CORE ────────────────────────────────────────────────────────────────────
insert into public.exercises (id, name, muscle_group, equipment, parent_id, owner_id)
values
  ('60000000-0000-0000-0000-000000000001', 'Plank', 'core', 'bodyweight', null, null),
  ('60000000-0000-0000-0000-000000000002', 'Crunch', 'core', 'bodyweight', null, null),
  ('60000000-0000-0000-0000-000000000003', 'Cable Crunch', 'core', 'cable', '60000000-0000-0000-0000-000000000002', null),
  ('60000000-0000-0000-0000-000000000004', 'Hanging Leg Raise', 'core', 'bodyweight', null, null),
  ('60000000-0000-0000-0000-000000000005', 'Ab Wheel Rollout', 'core', 'bodyweight', null, null),
  ('60000000-0000-0000-0000-000000000006', 'Russian Twist', 'core', 'dumbbell', null, null),
  ('60000000-0000-0000-0000-000000000007', 'Woodchop', 'core', 'cable', null, null),
  ('60000000-0000-0000-0000-000000000008', 'Dead Bug', 'core', 'bodyweight', null, null);
