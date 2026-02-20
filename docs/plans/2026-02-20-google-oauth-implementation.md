# Google OAuth + Login Error UX Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Google Sign-In to all auth screens and improve login error feedback with inline messages instead of Alert popups.

**Architecture:** Use `expo-auth-session` + `expo-web-browser` for Google OAuth flow, passing the ID token to Supabase's `signInWithIdToken`. Create a reusable `GoogleSignInButton` component used across Welcome, Login, and Register screens. Improve login/register error handling with inline error banners.

**Tech Stack:** expo-auth-session, expo-web-browser, expo-crypto, Supabase Auth (Google provider)

---

### Task 1: Install Dependencies

**Files:**
- Modify: `josical-app/package.json`
- Modify: `josical-app/app.json`

**Step 1: Install expo packages**

Run: `cd josical-app && npx expo install expo-auth-session expo-web-browser expo-crypto`

**Step 2: Add scheme to app.json for OAuth redirect**

Add `"scheme": "josical"` to the expo config so OAuth redirects work:

```json
{
  "expo": {
    "scheme": "josical",
    ...
  }
}
```

**Step 3: Commit**

```bash
git add josical-app/package.json josical-app/app.json
git commit -m "chore: add expo-auth-session, expo-web-browser, expo-crypto for Google OAuth"
```

---

### Task 2: Create Google Auth Library

**Files:**
- Create: `josical-app/src/lib/googleAuth.ts`

**Step 1: Create the Google auth helper**

This module wraps `expo-auth-session` Google provider. It handles the OAuth flow and returns an ID token for Supabase.

```typescript
import { makeRedirectUri } from 'expo-auth-session'
import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'

WebBrowser.maybeCompleteAuthSession()

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID

export function useGoogleAuth() {
  const redirectUri = makeRedirectUri({ scheme: 'josical' })

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: WEB_CLIENT_ID ?? '',
    iosClientId: IOS_CLIENT_ID ?? '',
    redirectUri,
  })

  return {
    request,
    response,
    promptAsync,
  }
}

export function getGoogleIdToken(
  response: Google.GoogleAuthSessionResult | null,
): string | null {
  if (response?.type !== 'success') return null
  return response.params.id_token ?? null
}
```

**Step 2: Commit**

```bash
git add josical-app/src/lib/googleAuth.ts
git commit -m "feat: add Google auth helper using expo-auth-session"
```

---

### Task 3: Add `loginWithGoogle` to Auth Store

**Files:**
- Modify: `josical-app/src/stores/authStore.ts`

**Step 1: Add the new action type and implementation**

Add to `AuthActions` type:
```typescript
readonly loginWithGoogle: (idToken: string) => Promise<void>
```

Add implementation in the store:
```typescript
loginWithGoogle: async (idToken) => {
  set({ isLoading: true })
  try {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    })
    if (error) throw error
    set({ session: data.session })
    if (data.session) {
      await get().fetchProfile()
    }
  } finally {
    set({ isLoading: false })
  }
},
```

**Step 2: Commit**

```bash
git add josical-app/src/stores/authStore.ts
git commit -m "feat: add loginWithGoogle action to auth store"
```

---

### Task 4: Create GoogleSignInButton Component

**Files:**
- Create: `josical-app/src/components/ui/GoogleSignInButton.tsx`
- Modify: `josical-app/src/components/ui/index.ts`

**Step 1: Create the branded Google button**

Standard Google branding: white background, Google "G" SVG, "Continue with Google" text.

```typescript
import React from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native'
import { colors, borderRadius, fontSize, fontWeight, spacing, shadow } from '../../constants/theme'

type GoogleSignInButtonProps = {
  readonly onPress: () => void
  readonly isLoading?: boolean
  readonly disabled?: boolean
  readonly style?: ViewStyle
}

function GoogleLogo() {
  return (
    <View style={logoStyles.container}>
      <Text style={logoStyles.text}>G</Text>
    </View>
  )
}

const logoStyles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  text: {
    fontSize: 16,
    fontWeight: fontWeight.bold,
    color: '#4285F4',
  },
})

export function GoogleSignInButton({
  onPress,
  isLoading = false,
  disabled = false,
  style,
}: GoogleSignInButtonProps) {
  const isDisabled = disabled || isLoading

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.text} size="small" />
      ) : (
        <View style={styles.content}>
          <GoogleLogo />
          <Text style={styles.text}>Continue with Google</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: 56,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    ...shadow.xs,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  disabled: {
    opacity: 0.5,
  },
})
```

**Step 2: Export from index**

Add to `josical-app/src/components/ui/index.ts`:
```typescript
export { GoogleSignInButton } from './GoogleSignInButton'
```

**Step 3: Commit**

```bash
git add josical-app/src/components/ui/GoogleSignInButton.tsx josical-app/src/components/ui/index.ts
git commit -m "feat: add GoogleSignInButton component with standard branding"
```

---

### Task 5: Create Inline Error Banner Component

**Files:**
- Create: `josical-app/src/components/ui/ErrorBanner.tsx`
- Modify: `josical-app/src/components/ui/index.ts`

**Step 1: Create inline error banner**

Replaces Alert.alert with a visible inline error message at the top of forms.

```typescript
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme'

type ErrorBannerProps = {
  readonly message: string | null
  readonly onDismiss?: () => void
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  if (!message) return null

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
      {onDismiss ? (
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.dismiss}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    fontSize: fontSize.sm,
    color: colors.error,
    fontWeight: fontWeight.medium,
    flex: 1,
    marginRight: spacing.sm,
  },
  dismiss: {
    fontSize: fontSize.md,
    color: colors.error,
    fontWeight: fontWeight.bold,
  },
})
```

**Step 2: Export from index**

Add to `josical-app/src/components/ui/index.ts`:
```typescript
export { ErrorBanner } from './ErrorBanner'
```

**Step 3: Commit**

```bash
git add josical-app/src/components/ui/ErrorBanner.tsx josical-app/src/components/ui/index.ts
git commit -m "feat: add ErrorBanner component for inline auth errors"
```

---

### Task 6: Update WelcomeScreen with Google Button

**Files:**
- Modify: `josical-app/src/app/screens/auth/WelcomeScreen.tsx`

**Step 1: Add Google sign-in to WelcomeScreen**

Add between "Get Started" and "I already have an account":
- An "or" Divider
- GoogleSignInButton
- Hook up `useGoogleAuth` + `loginWithGoogle`

The Google button goes in the `buttons` section. Flow:
1. Import `useGoogleAuth`, `getGoogleIdToken`, `GoogleSignInButton`, `Divider`
2. Add `useEffect` to watch for Google response
3. On success, call `loginWithGoogle` from authStore

**Step 2: Commit**

```bash
git add josical-app/src/app/screens/auth/WelcomeScreen.tsx
git commit -m "feat: add Google Sign-In button to WelcomeScreen"
```

---

### Task 7: Update LoginScreen with Google Button + Inline Errors

**Files:**
- Modify: `josical-app/src/app/screens/auth/LoginScreen.tsx`

**Step 1: Replace Alert with ErrorBanner**

- Add `authError` state
- Replace `Alert.alert(...)` with `setAuthError('Incorrect email or password')`
- Add `<ErrorBanner message={authError} onDismiss={() => setAuthError(null)} />` above the form
- Clear error on form field changes

**Step 2: Add Google sign-in button**

- Add GoogleSignInButton above the email form
- Add `<Divider label="or" />` between Google button and email form
- Hook up same `useGoogleAuth` + `loginWithGoogle` flow

**Step 3: Commit**

```bash
git add josical-app/src/app/screens/auth/LoginScreen.tsx
git commit -m "feat: add Google Sign-In + inline error banner to LoginScreen"
```

---

### Task 8: Update RegisterScreen with Google Button + Inline Errors

**Files:**
- Modify: `josical-app/src/app/screens/auth/RegisterScreen.tsx`

**Step 1: Same pattern as LoginScreen**

- Replace `Alert.alert(...)` with `ErrorBanner`
- Add GoogleSignInButton above the form
- Add `<Divider label="or" />` between Google button and form fields
- Hook up `useGoogleAuth` + `loginWithGoogle`

**Step 2: Commit**

```bash
git add josical-app/src/app/screens/auth/RegisterScreen.tsx
git commit -m "feat: add Google Sign-In + inline error banner to RegisterScreen"
```

---

### Task 9: Add Environment Variables + Documentation

**Files:**
- Modify: `josical-app/.env`
- Modify: `docs/plans/2026-02-20-google-oauth-design.md`

**Step 1: Add placeholder env vars**

Add to `.env`:
```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id-here
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id-here
```

**Step 2: Document Supabase + Google Cloud setup steps**

The user will need to:
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client IDs (Web + iOS)
3. Set authorized redirect URI to Supabase's callback URL
4. In Supabase Dashboard → Auth → Providers → Enable Google
5. Paste the Web Client ID and Client Secret
6. Update `.env` with real client IDs

**Step 3: Commit**

```bash
git add josical-app/.env
git commit -m "chore: add Google OAuth env var placeholders"
```

---

## Setup Required (Manual — Not Code)

After implementation, the user must:
1. Create a Google Cloud project (or use existing)
2. Enable Google Identity API
3. Create OAuth 2.0 credentials (Web + iOS client IDs)
4. Configure Supabase Google provider with those credentials
5. Replace placeholder values in `.env`
