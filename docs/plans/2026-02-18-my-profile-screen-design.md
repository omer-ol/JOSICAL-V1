# MyProfileScreen — Inline Editable Design

**Date:** 2026-02-18
**Issue:** #1 — Add photo button on profile does nothing

## Problem

`MyProfileScreen` is a placeholder ("Coming soon"). The add-photo button has no implementation.

## Goal

Build a full profile view screen with inline editing: avatar, bio, city, neighborhood. Fix the photo picker bug in the process.

## Approach: Inline Editable Profile

Single screen. Fields pre-populated from `authStore.profile`. User taps to edit in place. Save button appears when there are unsaved changes.

## Layout

1. **Avatar** (120px circle, centered) — shows `avatar_url` or initials fallback via `Avatar` component. Camera-icon badge at bottom-right. Tap → image picker.
2. **Name** — read-only display text.
3. **Bio** — tap to edit inline (multiline `TextInput`). Character counter.
4. **City** — tap → bottom-sheet picker (same as onboarding).
5. **Neighborhood** — tap → bottom-sheet picker (appears after city selected).
6. **Save button** — sticky footer, visible only when `isDirty`. Shows loading spinner.

## Data Flow

- Load: `profile` from `useAuthStore` pre-populates all local state.
- Local state: `avatarUri` (new pick URI), `bio`, `city`, `neighborhood`.
- `isDirty`: any field differs from current profile values.
- Save: `uploadAvatar(avatarUri)` if new photo → `profileStore.updateProfile(...)` → `authStore.setProfile(updated)`.

## Reuse

- `pickAvatar` + `uploadAvatar` pattern from `ProfileSetupScreen`
- `Avatar` component for display
- City/neighborhood picker UI from onboarding
- `Button`, `Input` from `components/ui`

## Error Handling

`Alert.alert` on upload or save failure (same as onboarding pattern).

## Files Touched

- `josical-app/src/app/screens/profile/MyProfileScreen.tsx` — full rewrite
