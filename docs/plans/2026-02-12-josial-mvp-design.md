# JoSial MVP Design Document

**Version**: 1.0
**Date**: February 12, 2026
**Status**: Approved

---

## Overview

JoSial is a mobile-first social platform for dog owners in Israel. The MVP focuses on the social core: authentication, user and dog profiles, neighbor discovery, friend connections, and real-time messaging.

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native with Expo |
| Language | TypeScript |
| State Management | Zustand |
| Backend | Supabase (Postgres, Auth, Realtime, Storage) |
| Chat | Supabase Realtime (WebSocket subscriptions) |
| Push Notifications | Expo Push Notifications |
| Navigation | React Navigation (5-tab bottom bar) |
| Location | City/neighborhood picker (no GPS in MVP) |
| UI Language | English-only |

## Architecture

```
Expo React Native App (TypeScript)
  ├── Zustand stores (auth, friends, chat, notifications, dogs)
  ├── Supabase JS Client (direct DB access via RLS)
  ├── React Navigation (5 tabs)
  └── Expo Push Notifications

         │
         ▼

Supabase Platform
  ├── Auth (email/password)
  ├── Postgres + Row Level Security
  ├── Realtime (chat subscriptions)
  ├── Storage (images)
  └── Edge Functions (push notifications, complex logic)
```

No Express server. The Supabase client talks directly to Postgres via RLS policies. Supabase auto-generates REST APIs from the schema.

## Brand Identity

Extracted from the JoSial logo:
- **Primary**: Golden/amber yellow (#F5A623)
- **Text/Dark**: Dark brown/charcoal (#3D2C1E)
- **Background**: Clean white (#FFFFFF)
- **Accent**: Golden sparkle highlights
- **Feel**: Warm, friendly, approachable. Rounded elements, soft shadows.

## Navigation Structure (5 Tabs)

| Tab | Icon | Screen | Purpose |
|---|---|---|---|
| Home | House | Activity timeline + dog cards | Landing experience |
| Discover | Compass | Nearby dog owners list | Core value prop |
| Messages | Chat bubble | Conversation list | Retention |
| Friends | People | Friends list + requests + suggestions | Social connections |
| Profile | Person | My profile + dogs + settings | Self-management |

## Database Schema

### profiles
Extends Supabase `auth.users`. Created via database trigger on signup.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | References auth.users(id), CASCADE delete |
| name | TEXT | Required, min 2 chars |
| bio | TEXT | Optional, max 200 chars |
| avatar_url | TEXT | Supabase Storage URL |
| city | TEXT | Israeli city |
| neighborhood | TEXT | Neighborhood within city |
| lat | DOUBLE PRECISION | City center latitude |
| lng | DOUBLE PRECISION | City center longitude |
| discovery_radius | NUMERIC | Default: 2 (km) |
| is_discoverable | BOOLEAN | Default: true |
| onboarding_completed | BOOLEAN | Default: false |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto |

### dogs

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| owner_id | UUID (FK) | References profiles(id), CASCADE |
| name | TEXT | Required |
| breed | TEXT | From static breed list |
| photo_url | TEXT | Supabase Storage URL |
| gender | TEXT | 'male' or 'female' |
| age_category | TEXT | 'puppy', 'adult', or 'senior' |
| is_neutered | BOOLEAN | Default: false |
| created_at | TIMESTAMPTZ | Auto |

### friend_requests

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| from_user_id | UUID (FK) | Sender |
| to_user_id | UUID (FK) | Recipient |
| status | TEXT | 'pending', 'accepted', 'declined', 'cancelled' |
| created_at | TIMESTAMPTZ | Auto |
| | UNIQUE | (from_user_id, to_user_id) |

### friendships
Materialized from accepted requests for fast bidirectional queries.

| Column | Type | Notes |
|---|---|---|
| user_id | UUID (FK) | One side |
| friend_id | UUID (FK) | Other side |
| created_at | TIMESTAMPTZ | Auto |
| | PK | (user_id, friend_id) |

### blocked_users

| Column | Type | Notes |
|---|---|---|
| blocker_id | UUID (FK) | Who blocked |
| blocked_id | UUID (FK) | Who was blocked |
| created_at | TIMESTAMPTZ | Auto |
| | PK | (blocker_id, blocked_id) |

### conversations

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Updated on new message |

### conversation_participants

| Column | Type | Notes |
|---|---|---|
| conversation_id | UUID (FK) | References conversations(id) |
| user_id | UUID (FK) | References profiles(id) |
| last_read_at | TIMESTAMPTZ | For read receipts |
| | PK | (conversation_id, user_id) |

### messages

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| conversation_id | UUID (FK) | References conversations(id) |
| sender_id | UUID (FK) | References profiles(id) |
| type | TEXT | 'text', 'image', 'location' |
| content | TEXT | Text content, image URL, or JSON location |
| created_at | TIMESTAMPTZ | Auto |

### notifications

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| user_id | UUID (FK) | Recipient |
| type | TEXT | Event type identifier |
| title | TEXT | Notification title |
| body | TEXT | Notification body |
| data | JSONB | Additional metadata |
| is_read | BOOLEAN | Default: false |
| created_at | TIMESTAMPTZ | Auto |

### activity_events

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| user_id | UUID (FK) | User this event is for |
| type | TEXT | Event type |
| data | JSONB | Event payload |
| created_at | TIMESTAMPTZ | Auto |

### push_tokens

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| user_id | UUID (FK) | Token owner |
| token | TEXT | Expo push token |
| created_at | TIMESTAMPTZ | Auto |
| | UNIQUE | (user_id, token) |

### Key Indexes
- `dogs(owner_id)` — dog lookup by owner
- `friend_requests(to_user_id, status)` — incoming pending requests
- `friendships(user_id)` and `friendships(friend_id)` — bidirectional lookup
- `messages(conversation_id, created_at)` — message ordering
- `notifications(user_id, is_read)` — unread count
- `profiles(city, neighborhood)` — location-based discovery
- `activity_events(user_id, created_at)` — timeline feed

## Project Structure

```
josical-app/
├── app.json
├── tsconfig.json
├── package.json
├── App.tsx
├── src/
│   ├── app/
│   │   ├── navigation/
│   │   │   ├── RootNavigator.tsx
│   │   │   ├── AuthNavigator.tsx
│   │   │   ├── MainTabNavigator.tsx
│   │   │   ├── OnboardingNavigator.tsx
│   │   │   └── types.ts
│   │   ├── screens/
│   │   │   ├── auth/
│   │   │   │   ├── WelcomeScreen.tsx
│   │   │   │   ├── LoginScreen.tsx
│   │   │   │   ├── RegisterScreen.tsx
│   │   │   │   └── ForgotPasswordScreen.tsx
│   │   │   ├── onboarding/
│   │   │   │   ├── ProfileSetupScreen.tsx
│   │   │   │   ├── DogSetupScreen.tsx
│   │   │   │   └── PreferencesScreen.tsx
│   │   │   ├── home/
│   │   │   │   └── HomeScreen.tsx
│   │   │   ├── discover/
│   │   │   │   ├── DiscoverScreen.tsx
│   │   │   │   └── UserProfileScreen.tsx
│   │   │   ├── messages/
│   │   │   │   ├── ConversationsScreen.tsx
│   │   │   │   ├── ChatScreen.tsx
│   │   │   │   └── NewConversationScreen.tsx
│   │   │   ├── friends/
│   │   │   │   ├── FriendsScreen.tsx
│   │   │   │   ├── RequestsScreen.tsx
│   │   │   │   └── SuggestionsScreen.tsx
│   │   │   └── profile/
│   │   │       ├── MyProfileScreen.tsx
│   │   │       ├── EditProfileScreen.tsx
│   │   │       ├── DogProfileScreen.tsx
│   │   │       └── SettingsScreen.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── dog/
│   │   ├── user/
│   │   ├── chat/
│   │   └── layout/
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── profileStore.ts
│   │   ├── dogsStore.ts
│   │   ├── friendsStore.ts
│   │   ├── chatStore.ts
│   │   └── notificationStore.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── distance.ts
│   │   └── validation.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useRealtime.ts
│   │   └── useDebounce.ts
│   ├── constants/
│   │   ├── breeds.ts
│   │   ├── locations.ts
│   │   └── theme.ts
│   └── types/
│       ├── database.ts
│       ├── navigation.ts
│       └── index.ts
├── supabase/
│   ├── migrations/
│   ├── functions/
│   │   └── push-notification/
│   └── seed.sql
└── __tests__/
```

## Feature Specifications

### Phase 0: Authentication & Onboarding

#### Registration Flow
1. Welcome screen with JoSial logo, tagline, Sign Up and Log In buttons
2. Registration form: Full Name, Email, Password, Confirm Password
3. Supabase Auth creates account + database trigger creates profiles row
4. Redirect to 3-step onboarding wizard

#### Login Flow
1. Email + Password form
2. Supabase Auth validates → session stored in Zustand + AsyncStorage
3. Check `onboarding_completed` flag:
   - true → MainTabNavigator
   - false → resume onboarding

#### Session Management
- Supabase handles JWT tokens and refresh automatically
- Zustand `authStore` syncs with Supabase session
- App launch: check stored session → auto-login if valid
- Logout: clear Supabase session + Zustand stores → Welcome screen

#### Password Reset
- Supabase built-in email flow with magic link or OTP

#### Onboarding Wizard (3 Steps)
**Step 1 — Your Profile**: Avatar (optional), bio (optional, 200 chars), city/neighborhood picker
**Step 2 — Your Dog**: Name (required), breed picker, photo (optional), gender, age category, neutered
**Step 3 — Preferences**: Discovery radius slider (0.5-10km), discoverability toggle, push notification permission

- Progress saved after each step (resume on re-login)
- Skip available on all steps except dog name
- "Add Another Dog" button in Step 2
- Confetti animation on completion
- Sets `onboarding_completed = true` on finish

### Phase 1: Social Connection

#### Home Screen
- **Header**: "Good morning, [Name]" + notification bell (badge)
- **My Dogs carousel**: Horizontal scroll of dog cards + "Add Dog" CTA
- **Activity timeline**: Scrollable feed of events:
  - `friend_accepted`: "[Name] and you are now friends!"
  - `friend_request`: "[Name] wants to connect" with Accept/Decline inline
  - `new_neighbor`: "New dog owner near you: [Name]"
  - `dog_added`: "[Friend] added [DogName] the [Breed]"
  - `welcome`: First-time welcome card with CTAs

#### Neighbor Discovery
- Vertically scrolling UserCard list, sorted by distance (closest first)
- Each card: avatar, name, dogs (thumbnails), distance ("1.5 km away")
- Radius filter: bottom sheet with slider (0.5-10km)
- Exclusions: self, blocked, non-discoverable, existing friends
- Pagination: 20/page, infinite scroll
- Cold start: auto-expand to 10km if <3 results, share invite if zero
- Global search bar: name, dog name, breed (debounced 300ms, min 2 chars)

#### Friend Requests
- **Send**: "Add Friend" button on UserCard → insert friend_request → button → "Request Sent"
- **Receive**: Badge on Friends tab → RequestsScreen with Accept/Decline
- **Accept**: Create bilateral friendships rows, update request status, create activity event + notification
- **Decline**: Update status, no notification to sender
- **Cancel**: Sender cancels pending outgoing request
- **Block**: Remove friendship, hide from all contexts, prevent future requests
- **Unfriend**: Remove friendship, can re-request

#### Friends List
- Alphabetical list with avatar, name, dogs
- Search bar filtering by name (debounced)
- Tap → profile, long-press → quick actions (message, unfriend, block)

#### Friend Suggestions
- Users within discovery radius who aren't friends or blocked
- Sorted by proximity, optionally weighted by similar breeds/neighborhood

### Phase 2: Real-Time Messaging

#### Architecture
- Supabase Realtime WebSocket subscriptions for instant message delivery
- No polling required
- Push notifications for backgrounded users via Expo Push + Supabase Edge Functions

#### Conversation List
- Sorted by most recent message
- Each row: avatar, name, last message preview (50 chars), timestamp, unread badge
- Realtime subscription updates previews live
- Swipe left to delete (with confirmation)

#### New Conversation
- Search through friends list
- Tap friend → find or create conversation → navigate to chat

#### Chat Screen
- Sender messages right (blue), receiver left (gray)
- Text input with Send button + image picker
- Realtime subscription for instant message display
- Read receipts via `conversation_participants.last_read_at`
- Message types:
  - `text`: Plain text, max 2000 chars
  - `image`: Uploaded to Supabase Storage, URL in content
  - `location`: JSON `{ lat, lng, label }`, renders as tappable card

#### Push Notifications
- Trigger: Edge Function on messages INSERT
- Payload: `{ title: senderName, body: preview, data: { conversationId } }`
- Suppressed when recipient is viewing the conversation
- Push tokens stored in `push_tokens` table

### Profile & Settings

#### My Profile
- Large avatar, name, bio, stats (friends count, member since)
- Dogs section with edit/delete/add
- Actions: Edit Profile, Settings, Friends List, Share

#### Edit Profile
- Avatar picker (expo-image-picker → Supabase Storage)
- Name, bio (with character counter), city/neighborhood picker

#### Dog Profile (Add/Edit)
- Name, breed picker (searchable modal), photo, gender toggle, age category, neutered toggle

#### Settings
- Account: change email, change password
- Privacy: discoverability toggle, blocked users list
- Notifications: per-category toggles (messages, friend requests, suggestions)
- Discovery: radius slider
- About: version, terms, privacy policy
- Logout: clear session
- Delete Account: confirmation → cascade delete all data

## Phased Build Roadmap

| Phase | Features | Builds On |
|---|---|---|
| Phase 0 | Auth, Onboarding, Profiles, Dogs | Foundation |
| Phase 1 | Home, Discover, Friends, Suggestions, Search | Phase 0 |
| Phase 2 | Messaging (Realtime), Push Notifications | Phase 1 |
| Phase 3 (post-MVP) | Dog Park Map, Check-ins, Ratings | Phase 2 |
| Phase 4 (post-MVP) | Walker Marketplace, Payments | Phase 3 |

## Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Cold start (empty discover) | HIGH | Auto-expand radius, invite flow, seed data for beta |
| Supabase free tier limits | MEDIUM | Monitor usage, upgrade plan before launch |
| Push notification deliverability | MEDIUM | Test on real devices early, handle token refresh |
| Image storage costs | LOW | Compress images client-side before upload (max 500KB) |
| Location accuracy from city picker | LOW | Acceptable for 2km+ radius. GPS upgrade in future phase |
