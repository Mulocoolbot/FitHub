# FitHub — Gym Progress Tracker

Cross-platform mobile app for tracking gym workouts and measuring strength progress over time.

## Tech Stack

- **Mobile:** Expo SDK 57 + React Native + TypeScript (strict)
- **Routing:** Expo Router (file-based)
- **State:** TanStack Query v5 (server) + Zustand (UI)
- **Backend:** Supabase (Postgres + Auth + RLS + Edge Functions)
- **Styling:** StyleSheet + design tokens (no Tailwind)
- **Charts:** Victory Native XL + React Native Skia
- **Icons:** lucide-react-native

## Setup from Zero

### Prerequisites
- Node.js 20+
- Expo CLI (`npx expo`)
- Supabase CLI (`npx supabase`)
- iOS Simulator (Xcode) and/or Android Emulator

### 1. Clone & Install

```bash
git clone git@github.com:<your-username>/FitHub.git
cd FitHub
npm install
```

### 2. Environment

```bash
cp .env.example .env
# Fill in your Supabase URL, anon key, and OAuth credentials
```

### 3. Database Migrations

Apply the migration files to your Supabase project:

```bash
npx supabase login
npx supabase link --project-ref whiwnmcoqotfxpulcnbi
npx supabase db push
```

Alternatively, paste the contents of `supabase/migrations/*.sql` in order (00001 to 00004) in the Supabase Dashboard SQL Editor.

### 4. SMS Hook Secret

The `send-sms` Edge Function verifies webhook signatures from Supabase Auth. You must generate and set a matching secret:

```bash
# Generate a secret
echo "v1,whsec_$(openssl rand -base64 32)"

# Set it as an Edge Function secret (NOT in .env)
npx supabase secrets set SEND_SMS_HOOK_SECRET="v1,whsec_<paste-here>"

# Deploy the function (must use --no-verify-jwt because Auth Hook uses webhook signatures, not client JWT)
npx supabase functions deploy send-sms --no-verify-jwt
```

Then go to **Supabase Dashboard → Authentication → Hooks → Send SMS hook** and set the **exact same** secret there. Both sides must match or `wh.verify()` will fail.

### 5. Run Development Build

> ⚠️ **IMPORTANT:** Google Sign-In uses native module (`@react-native-google-signin/google-signin`), which requires a development build rather than Expo Go.

```bash
# iOS Simulator:
npx expo run:ios

# Android Emulator:
npx expo run:android

# Or start the Metro bundler:
npx expo start --dev-client
```

### 6. Verify RLS Policies & TypeScript

```bash
# TypeScript strict type check:
npx tsc --noEmit

# Test RLS isolation:
node scripts/test-rls.js
```

## Project Structure

```
src/
  app/                    # Expo Router routes
    (auth)/               # Auth flow screens
    (tabs)/               # Main tab screens
  features/
    auth/                 # Authentication feature
    workout/              # Workout CRUD feature
    progress/             # Progress tracking (Fase 2)
    exercises/            # Exercise catalog
    profile/              # User profile
  shared/
    ui/tokens.ts          # Design system tokens
    ui/components/        # Reusable UI components
    lib/                  # Supabase client, formatters, schemas
    types/                # TypeScript type definitions
supabase/
  migrations/             # SQL migrations
  functions/              # Edge Functions
```

## Design Tokens

All visual values come from `src/shared/ui/tokens.ts`. No magic numbers in components.

## Key Decisions

- **e1RM (Epley formula)** used for progress comparison, not raw weight
- **RLS on all tables** — no exceptions
- **Offline-first** — TanStack Query persister + optimistic mutations
- **Session token in expo-secure-store** — not AsyncStorage
- **SMS Hook uses Standard Webhooks signature verification** — `SEND_SMS_HOOK_SECRET` must be set as an Edge Function secret and matched in the Dashboard hook config
- **Google Sign-In: nonce not implemented** — `@react-native-google-signin/google-signin` v14 does not expose a `nonce` parameter in `signIn()`. Forcing nonce on one side only causes "Nonces mismatch" errors. `expo-crypto` is kept as a dependency, ready for use once a future library version adds support. See `src/features/auth/api/auth.ts` for details.
