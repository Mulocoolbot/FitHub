/**
 * Auth Repository
 *
 * Three separate login methods (spec Bagian 8.1):
 * 1. Google — native sign-in via @react-native-google-signin, no OTP
 * 2. Email — OTP 6-digit via email
 * 3. Phone — OTP 6-digit via SMS/WhatsApp (dev mode: logged to console)
 *
 * Google Sign-In uses native module (not browser redirect) per spec Bagian 8.2.
 * Requires development build, NOT Expo Go.
 */
import { supabase } from '../../../shared/lib/supabase';
import { Platform } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

// Configure Google Sign-In with Web client ID (used for ID token verification)
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB ?? '',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS ?? '',
  offlineAccess: true,
});

/**
 * Sign in with Google OAuth (native, not browser redirect).
 *
 * Flow: native Google dialog → ID token → supabase.auth.signInWithIdToken()
 * User never leaves the app.
 *
 * ─── NONCE NOT IMPLEMENTED ────────────────────────────────────────────
 * Ideally, a random nonce should be generated (via expo-crypto), hashed
 * (SHA-256), passed to GoogleSignin.signIn({ nonce: hashedNonce }), and
 * the raw nonce sent to supabase.auth.signInWithIdToken({ nonce: rawNonce }).
 * This binds the ID token to a single sign-in request, preventing replay
 * attacks (standard OIDC practice).
 *
 * However, @react-native-google-signin/google-signin v14 does NOT expose
 * a `nonce` parameter in its `SignInParams` type — only `loginHint` (iOS).
 * Sending nonce to only one side (Google OR Supabase) causes a "Nonces
 * mismatch" error. Therefore, nonce is intentionally omitted from BOTH
 * sides until the library adds support.
 *
 * expo-crypto remains in package.json as a dependency, ready for use once
 * a future version of the library supports custom nonce.
 *
 * Tracked as a known limitation in README.md → Key Decisions.
 * ──────────────────────────────────────────────────────────────────────
 */
export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();

  if (!response.data?.idToken) {
    throw new Error('Google Sign-In failed: no ID token returned');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: response.data.idToken,
  });

  if (error) throw error;
  return data;
}

/**
 * Send OTP to email address.
 */
export async function sendEmailOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });
  if (error) throw error;
}

/**
 * Verify email OTP code.
 */
export async function verifyEmailOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  if (error) throw error;
  return data;
}

/**
 * Send OTP to phone number.
 * In dev mode, the SMS Hook logs the code to console.
 */
export async function sendPhoneOtp(phone: string) {
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      shouldCreateUser: true,
    },
  });
  if (error) throw error;
}

/**
 * Verify phone OTP code.
 */
export async function verifyPhoneOtp(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });
  if (error) throw error;
  return data;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  // Also sign out from Google to allow account switching
  try {
    await GoogleSignin.signOut();
  } catch {
    // Ignore — user may not have signed in with Google
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get the current session, if any.
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Get the current user's profile.
 */
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Update the current user's profile (onboarding).
 */
export async function updateProfile(
  userId: string,
  updates: {
    display_name?: string | null;
    unit_pref?: 'kg' | 'lb';
    timezone?: string;
  },
) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
