# Google OAuth Design — JoSial

**Date:** 2026-02-20
**Status:** Approved

## Overview

Add "Continue with Google" as a third-party login option across all auth screens (Welcome, Login, Register), using Supabase's built-in Google OAuth provider with `expo-auth-session` for the native flow.

## Architecture

**Library:** `expo-auth-session` + `expo-web-browser` — the standard Expo approach for OAuth. Works with Supabase's `signInWithIdToken` method.

**Flow:**

1. User taps "Continue with Google"
2. `expo-auth-session` opens Google's consent screen (in-app browser)
3. Google returns an ID token
4. We pass that token to `supabase.auth.signInWithIdToken({ provider: 'google', token })`
5. Supabase creates/matches the user and returns a session
6. `authStore` checks if a profile exists:
   - **Exists** → route to main app
   - **Doesn't exist** → route to onboarding (pre-fill name/email from Google)

## UI Changes

### WelcomeScreen

Add "Continue with Google" button between "Get Started" and "I already have an account", with an "or" divider line.

### LoginScreen

Add "Continue with Google" button above the email form, with an "or" divider below it.

### RegisterScreen

Add "Continue with Google" button above the email form, with an "or" divider below it.

### Button Style

White background, Google "G" logo, "Continue with Google" text — standard Google branding.

## Auth Store Changes

- Add `loginWithGoogle(idToken: string)` action to `authStore`
- Calls `supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })`
- On success, attempts `fetchProfile()` — if no profile, the RootNavigator routes to onboarding automatically

## New Files

- `src/lib/googleAuth.ts` — handles `expo-auth-session` config and token retrieval
- `src/components/ui/GoogleSignInButton.tsx` — reusable branded button

## Dependencies

- `expo-auth-session`
- `expo-web-browser`
- `expo-crypto` (required peer dep)

## Supabase Config Required

- Enable Google provider in Supabase Dashboard → Auth → Providers
- Set up Google Cloud Console OAuth credentials (Client ID + redirect URI)
- Add web + iOS client IDs

## Error Handling

- User cancels → silent, no error shown
- Google auth fails → Alert: "Google sign-in failed. Please try again."
- Supabase token exchange fails → Alert: "Could not complete sign-in. Please try again."

## Future

- Apple Sign-In will be added before App Store submission (required by Apple policy when offering third-party login)
