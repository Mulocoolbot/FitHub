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

### 3. Database

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

### 4. Run

```bash
npx expo start
# Press 'i' for iOS simulator or 'a' for Android emulator
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
