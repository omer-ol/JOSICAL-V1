# JoSial - The Social Platform for Dog Owners

A mobile-first social platform connecting dog owners in Israel. Discover neighbors, build friendships, and grow your dog community.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native (Expo SDK 54) |
| Language | TypeScript |
| State | Zustand |
| Backend | Supabase (Postgres + Auth + Storage + Realtime) |
| Navigation | React Navigation v7 |
| Validation | Zod |
| Icons | Ionicons (@expo/vector-icons) |

## Current Status

**Phase 0: Authentication & Onboarding** — Complete
**Phase 1: Social Connection** — Complete
**Phase 2: Real-Time Messaging** — Not started

## Features

### Authentication
- Email/password registration with validation
- Login with error handling
- Google OAuth sign-in (needs credentials configured)
- Password reset via email
- Session persistence with auto-refresh tokens

### Onboarding (3-step wizard)
1. **Profile Setup** — Avatar upload, bio, city/neighborhood picker
2. **Dog Setup** — Name, breed (searchable), gender, age, neutered toggle
3. **Preferences** — Discovery radius, discoverability toggle

### Home Screen
- Time-based greeting ("Good morning/afternoon/evening")
- Stats cards (friends, dogs, pending requests)
- Horizontal dog carousel
- Activity timeline with event types

### Discover
- Browse nearby discoverable dog owners
- Search by name, location, or dog name/breed
- Send friend requests directly from cards
- Filters out self, blocked users, and existing friends

### Friends
- Friends list with search
- Incoming/outgoing friend requests (accept, decline, cancel)
- Friend suggestions (nearby non-friends)
- User profiles with friend/block actions

### Profile & Settings
- Owner/Dog tab switcher with inline editing
- Avatar upload to Supabase Storage
- Bio (200 char limit), city/neighborhood selectors
- Dog CRUD (add, edit, delete with breed picker)
- Settings: discovery toggle, radius (5-50km), blocked users
- Logout and delete account

## Project Structure

```
josical-app/
├── App.tsx                          # Entry point
├── src/
│   ├── app/
│   │   ├── navigation/              # React Navigation setup
│   │   │   ├── RootNavigator.tsx     # Auth → Onboarding → Main routing
│   │   │   ├── AuthNavigator.tsx     # Welcome, Login, Register, ForgotPassword
│   │   │   ├── OnboardingNavigator.tsx
│   │   │   ├── MainTabNavigator.tsx  # 5-tab bottom bar
│   │   │   ├── HomeStackNavigator.tsx
│   │   │   ├── DiscoverStackNavigator.tsx
│   │   │   ├── FriendsStackNavigator.tsx
│   │   │   ├── ProfileStackNavigator.tsx
│   │   │   └── types.ts
│   │   └── screens/
│   │       ├── auth/                 # Welcome, Login, Register, ForgotPassword
│   │       ├── onboarding/           # ProfileSetup, DogSetup, Preferences
│   │       ├── home/                 # HomeScreen
│   │       ├── discover/             # DiscoverScreen, UserProfileScreen
│   │       ├── friends/              # FriendsScreen, RequestsScreen, SuggestionsScreen
│   │       ├── messages/             # ConversationsScreen (placeholder)
│   │       └── profile/              # MyProfileScreen, DogProfileScreen, SettingsScreen
│   ├── components/ui/                # Reusable UI components
│   │   ├── Button.tsx                # 5 variants, 3 sizes
│   │   ├── Input.tsx                 # With label, error, focus states
│   │   ├── Card.tsx                  # Pressable with elevation
│   │   ├── Avatar.tsx                # Image or initials fallback
│   │   ├── Badge.tsx                 # Notification badge
│   │   ├── Divider.tsx
│   │   ├── ErrorBanner.tsx
│   │   ├── GoogleSignInButton.tsx
│   │   └── LoadingSpinner.tsx
│   ├── stores/                       # Zustand state management
│   │   ├── authStore.ts              # Session, login, register, logout
│   │   ├── profileStore.ts           # Profile updates, preferences
│   │   ├── dogsStore.ts              # Dog CRUD operations
│   │   └── friendsStore.ts           # Friends, requests, blocks
│   ├── lib/
│   │   ├── supabase.ts               # Supabase client config
│   │   ├── validation.ts             # Zod schemas
│   │   ├── distance.ts               # Haversine formula
│   │   └── googleAuth.ts             # Google OAuth helpers
│   ├── hooks/
│   │   └── useDebounce.ts
│   ├── constants/
│   │   ├── theme.ts                  # Colors, spacing, typography
│   │   ├── locations.ts              # 18 Israeli cities + neighborhoods
│   │   └── breeds.ts                 # 120+ dog breeds
│   └── types/
│       └── database.ts               # All entity types
├── supabase/
│   └── migrations/
│       └── 00001_initial_schema.sql  # 11 tables + RLS + triggers
└── .env                              # Supabase + Google OAuth keys
```

## Database

11 tables with Row Level Security:

| Table | Purpose |
|-------|---------|
| profiles | User profiles (extends auth.users) |
| dogs | Dog ownership |
| friend_requests | Request tracking with status |
| friendships | Bilateral friend relationships |
| blocked_users | Block list |
| conversations | Chat conversations (Phase 2) |
| conversation_participants | Read receipts (Phase 2) |
| messages | Chat messages (Phase 2) |
| notifications | User notifications (Phase 2) |
| activity_events | Home screen timeline |
| push_tokens | Expo push tokens (Phase 2) |

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Supabase project (free tier works)

### Setup

```bash
# Clone the repo
git clone https://github.com/omer-ol/JOSICAL-V1.git
cd "Josical V1/josical-app"

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# Run the database migration
# Copy supabase/migrations/00001_initial_schema.sql into Supabase SQL Editor and execute

# Start the app
npx expo start
```

### Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-google-ios-client-id
```

## Roadmap

| Phase | Status | Features |
|-------|--------|----------|
| Phase 0 | Done | Auth, onboarding, profiles, dogs |
| Phase 1 | Done | Home feed, discover, friends, settings |
| Phase 2 | Next | Real-time messaging, push notifications |
| Phase 3 | Planned | Dog park map, check-ins |
| Phase 4 | Planned | Walker marketplace |

## Open Issues

See [GitHub Issues](https://github.com/omer-ol/JOSICAL-V1/issues) for current bugs and planned features.

## License

Private project. All rights reserved.
