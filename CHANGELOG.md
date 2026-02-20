# Changelog

All notable changes to JoSial are documented here.

## [Unreleased]

### Added

**Phase 0: Authentication & Onboarding (Complete)**
- Welcome screen with JoSial logo, Sign Up and Log In buttons
- Registration form with Zod validation (name, email, password, confirm)
- Login form with inline error banners
- Forgot Password screen with Supabase email reset flow
- Google OAuth sign-in button (expo-auth-session + Supabase signInWithIdToken)
- 3-step onboarding wizard: Profile Setup → Dog Setup → Preferences
- Avatar upload via expo-image-picker → Supabase Storage
- City/neighborhood picker (18 Israeli cities)
- Searchable breed picker (120+ breeds)
- Email confirmation UI when Supabase requires verification

**Phase 1: Social Connection (Complete)**
- 5-tab bottom navigation: Home, Discover, Messages, Friends, Profile
- Home screen: time-based greeting, stats cards, dog carousel, activity timeline
- Discover screen: browse nearby dog owners, search by name/location/dog, Add Friend button
- UserProfile screen: view other user's profile + dogs, friend actions, block user
- Friends screen: friends list with search, header icons for requests/suggestions
- Requests screen: incoming/outgoing tabs with Accept/Decline/Cancel actions
- Suggestions screen: non-friend discoverable users with one-tap add
- MyProfile screen: Owner/Dog tab switcher, inline bio/city editing, dog CRUD
- DogProfile screen: dedicated add/edit/delete dog with breed picker, gender/age/neutered
- Settings screen: discovery toggle, radius chips (5-50km), blocked users, logout, delete account
- Friends store: full CRUD — send/accept/decline/cancel requests, unfriend, block/unblock
- Dogs store: fetchMyDogs, addDog, updateDog, deleteDog, fetchUserDogs
- Profile store: updateProfile, updatePreferences, completeOnboarding

**Infrastructure**
- Expo SDK 54, React Native 0.81, TypeScript, New Architecture
- Supabase backend: Postgres + Auth + Storage + RLS policies
- Zustand state management (4 stores: auth, profile, dogs, friends)
- React Navigation v7 (bottom tabs + 4 native stack navigators)
- Zod validation schemas for auth, profile, dogs, messages
- Database migration with 11 tables, triggers, indexes, RLS policies
- Supabase Realtime publication enabled for messages, notifications, conversation_participants
- JoSial brand theme: golden amber (#F5A623), dark brown (#3D2C1E), warm white
- 9 reusable UI components: Button, Input, Card, Avatar, Badge, Divider, LoadingSpinner, ErrorBanner, GoogleSignInButton
- Haversine distance calculation utility
- useDebounce custom hook
- 18 Israeli cities with neighborhoods and coordinates
- 120+ dog breeds with search

### Fixed
- Registration silent failure when Supabase requires email confirmation — now throws `CONFIRMATION_REQUIRED` and shows "Check your email" UI
- Avatar save bug on MyProfileScreen
- Web platform logout using `window.confirm` instead of `Alert.alert`

### Security
- Row Level Security (RLS) enabled on all 11 database tables
- Profiles: anyone can read, only owner can update
- Dogs: anyone can read, only owner can CUD
- Friend requests: only involved users can read/update
- Friendships: only involved users can read/insert/delete
- Blocked users: only blocker can manage
- Conversations/messages: only participants can access
- Notifications: only recipient can read/update
- Push tokens: only owner can manage
- Supabase Auth with JWT auto-refresh + AsyncStorage persistence

## Known Issues
- Google OAuth has placeholder credentials (needs Google Cloud Console setup)
- Discover screen flickering/re-fetching continuously (#9)
- Messages tab is a placeholder ("Coming soon")
- No tests written yet
- No push notifications yet
