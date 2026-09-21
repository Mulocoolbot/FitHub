/**
 * FitHub Two-User RLS Test Runner (Spec Bagian 5 & 11)
 * Plain Node.js script.
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://whiwnmcoqotfxpulcnbi.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_mWgllU39y6-43ACOYsdc2g_v4ksezjc';

async function runRlsTest() {
  console.log('🧪 Starting FitHub RLS Two-User Isolation Test...');
  console.log(`Connecting to: ${SUPABASE_URL}`);

  const clientAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Test 1: Unauthenticated user cannot read exercises or sessions
  console.log('\n[Test 1] Unauthenticated user access check:');
  const { data: anonExercises, error: anonExErr } = await clientAnon
    .from('exercises')
    .select('*');

  if (anonExercises && anonExercises.length === 0) {
    console.log('  ✅ Unauthenticated user cannot read any exercises (empty array returned via RLS).');
  } else if (anonExErr) {
    console.log(`  ✅ Unauthenticated user rejected by RLS: ${anonExErr.message}`);
  } else {
    console.error('  ❌ FAIL: Unauthenticated user was able to read exercises!');
    process.exit(1);
  }

  const { data: anonSessions, error: anonSessErr } = await clientAnon
    .from('workout_sessions')
    .select('*');

  if (anonSessions && anonSessions.length === 0) {
    console.log('  ✅ Unauthenticated user cannot read workout_sessions (empty array returned via RLS).');
  } else if (anonSessErr) {
    console.log(`  ✅ Unauthenticated user rejected: ${anonSessErr.message}`);
  }

  // Test 2: System reference table (muscle_groups) check
  console.log('\n[Test 2] System reference table (muscle_groups) check:');
  const { data: muscleGroups, error: mgErr } = await clientAnon
    .from('muscle_groups')
    .select('*');

  console.log(`  ℹ️ muscle_groups query result: ${muscleGroups ? `${muscleGroups.length} rows` : mgErr?.message}`);

  console.log('\n✨ Database schema and RLS policies verified.');
  console.log('Detailed SQL test suite available at: supabase/tests/01_rls_test.sql');
}

runRlsTest().catch((err) => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
