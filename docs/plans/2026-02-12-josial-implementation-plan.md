# JoSial MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the JoSial MVP — a social platform for Israeli dog owners with auth, profiles, neighbor discovery, friends, and real-time messaging.

**Architecture:** Expo React Native app (TypeScript) with Supabase backend. No Express server — the app talks directly to Supabase via RLS-protected client. Zustand for state management. Supabase Realtime for instant chat.

**Tech Stack:** Expo SDK, TypeScript, Zustand, Supabase (Postgres + Auth + Realtime + Storage), React Navigation, Expo Push Notifications, Zod validation.

**Design doc:** `docs/plans/2026-02-12-josial-mvp-design.md`

---

## Phase 0: Foundation & Authentication

### Task 1: Initialize Expo Project

**Files:**
- Create: `josical-app/` (Expo project root)

**Step 1: Create Expo project with TypeScript template**

```bash
cd "/Users/omerhanoh/Desktop/עומר/Projects/Josical V1"
npx create-expo-app@latest josical-app --template blank-typescript
```

**Step 2: Install core dependencies**

```bash
cd josical-app
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack react-native-screens react-native-safe-area-context
npx expo install @supabase/supabase-js react-native-url-polyfill @react-native-async-storage/async-storage
npm install zustand zod
npm install -D @types/react @types/react-native
```

**Step 3: Verify the app runs**

```bash
npx expo start
```

Expected: Expo dev server starts, app loads on simulator/device.

**Step 4: Commit**

```bash
git add josical-app/
git commit -m "chore: initialize Expo project with core dependencies"
```

---

### Task 2: Theme Constants & Brand Identity

**Files:**
- Create: `josical-app/src/constants/theme.ts`

**Step 1: Create theme file with brand colors and typography**

```typescript
// src/constants/theme.ts

export const colors = {
  primary: '#F5A623',
  primaryLight: '#FFF3D6',
  primaryDark: '#D4891A',
  text: '#3D2C1E',
  textSecondary: '#8A7A6D',
  textLight: '#B5A99A',
  background: '#FFFFFF',
  backgroundSecondary: '#F8F6F3',
  border: '#E8E2DA',
  error: '#E74C3C',
  errorLight: '#FDEDEC',
  success: '#27AE60',
  successLight: '#EAFAF1',
  white: '#FFFFFF',
  black: '#1A1A1A',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  message: {
    sent: '#F5A623',
    received: '#F0EDE8',
  },
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 34,
} as const

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
}

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} as const
```

**Step 2: Commit**

```bash
git add src/constants/theme.ts
git commit -m "feat: add theme constants with JoSial brand identity"
```

---

### Task 3: TypeScript Types

**Files:**
- Create: `josical-app/src/types/database.ts`
- Create: `josical-app/src/types/index.ts`

**Step 1: Create database types matching the schema**

```typescript
// src/types/database.ts

export type UserProfile = {
  readonly id: string
  readonly name: string
  readonly bio: string | null
  readonly avatar_url: string | null
  readonly city: string | null
  readonly neighborhood: string | null
  readonly lat: number | null
  readonly lng: number | null
  readonly discovery_radius: number
  readonly is_discoverable: boolean
  readonly onboarding_completed: boolean
  readonly created_at: string
  readonly updated_at: string
}

export type Dog = {
  readonly id: string
  readonly owner_id: string
  readonly name: string
  readonly breed: string | null
  readonly photo_url: string | null
  readonly gender: 'male' | 'female' | null
  readonly age_category: 'puppy' | 'adult' | 'senior' | null
  readonly is_neutered: boolean
  readonly created_at: string
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled'

export type FriendRequest = {
  readonly id: string
  readonly from_user_id: string
  readonly to_user_id: string
  readonly status: FriendRequestStatus
  readonly created_at: string
}

export type Friendship = {
  readonly user_id: string
  readonly friend_id: string
  readonly created_at: string
}

export type BlockedUser = {
  readonly blocker_id: string
  readonly blocked_id: string
  readonly created_at: string
}

export type Conversation = {
  readonly id: string
  readonly created_at: string
  readonly updated_at: string
}

export type ConversationParticipant = {
  readonly conversation_id: string
  readonly user_id: string
  readonly last_read_at: string | null
}

export type MessageType = 'text' | 'image' | 'location'

export type Message = {
  readonly id: string
  readonly conversation_id: string
  readonly sender_id: string
  readonly type: MessageType
  readonly content: string
  readonly created_at: string
}

export type Notification = {
  readonly id: string
  readonly user_id: string
  readonly type: string
  readonly title: string
  readonly body: string | null
  readonly data: Record<string, unknown>
  readonly is_read: boolean
  readonly created_at: string
}

export type ActivityEventType =
  | 'friend_accepted'
  | 'friend_request'
  | 'new_neighbor'
  | 'dog_added'
  | 'welcome'

export type ActivityEvent = {
  readonly id: string
  readonly user_id: string
  readonly type: ActivityEventType
  readonly data: Record<string, unknown>
  readonly created_at: string
}

export type PushToken = {
  readonly id: string
  readonly user_id: string
  readonly token: string
  readonly created_at: string
}
```

```typescript
// src/types/index.ts

export type {
  UserProfile,
  Dog,
  FriendRequest,
  FriendRequestStatus,
  Friendship,
  BlockedUser,
  Conversation,
  ConversationParticipant,
  Message,
  MessageType,
  Notification,
  ActivityEvent,
  ActivityEventType,
  PushToken,
} from './database'
```

**Step 2: Commit**

```bash
git add src/types/
git commit -m "feat: add TypeScript types for database entities"
```

---

### Task 4: Supabase Client Setup

**Files:**
- Create: `josical-app/src/lib/supabase.ts`
- Create: `josical-app/.env.example`

**Step 1: Create Supabase client**

```typescript
// src/lib/supabase.ts

import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

**Step 2: Create .env.example**

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Step 3: Add .env to .gitignore** (verify the root .gitignore covers it)

**Step 4: Commit**

```bash
git add src/lib/supabase.ts .env.example
git commit -m "feat: add Supabase client with AsyncStorage session persistence"
```

---

### Task 5: Supabase Database Migrations

**Files:**
- Create: `josical-app/supabase/migrations/00001_initial_schema.sql`
- Create: `josical-app/supabase/seed.sql`

**Step 1: Write the Phase 0+1+2 migration**

```sql
-- supabase/migrations/00001_initial_schema.sql

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 2),
  bio TEXT CHECK (char_length(bio) <= 200),
  avatar_url TEXT,
  city TEXT,
  neighborhood TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  discovery_radius NUMERIC DEFAULT 2,
  is_discoverable BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Dogs
CREATE TABLE public.dogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  breed TEXT,
  photo_url TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')),
  age_category TEXT CHECK (age_category IN ('puppy', 'adult', 'senior')),
  is_neutered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_dogs_owner_id ON public.dogs(owner_id);

-- Friend Requests
CREATE TABLE public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX idx_friend_requests_to_status ON public.friend_requests(to_user_id, status);

-- Friendships (bilateral: A->B and B->A)
CREATE TABLE public.friendships (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, friend_id)
);

CREATE INDEX idx_friendships_friend_id ON public.friendships(friend_id);

-- Blocked Users
CREATE TABLE public.blocked_users (
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- Conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Conversation Participants
CREATE TABLE public.conversation_participants (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'location')),
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_conversation_created ON public.messages(conversation_id, created_at);

-- Update conversation.updated_at on new message
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger AS $$
BEGIN
  UPDATE public.conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, is_read);

-- Activity Events
CREATE TABLE public.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activity_events_user_created ON public.activity_events(user_id, created_at DESC);

-- Push Tokens
CREATE TABLE public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, only owner can update
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Dogs: anyone can read, only owner can CUD
CREATE POLICY "Dogs are viewable by everyone" ON public.dogs
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own dogs" ON public.dogs
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own dogs" ON public.dogs
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own dogs" ON public.dogs
  FOR DELETE USING (auth.uid() = owner_id);

-- Friend Requests: involved users can read, sender can insert/update
CREATE POLICY "Users can see their friend requests" ON public.friend_requests
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send friend requests" ON public.friend_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Involved users can update friend requests" ON public.friend_requests
  FOR UPDATE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Friendships: involved users can read
CREATE POLICY "Users can see their friendships" ON public.friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can insert friendships" ON public.friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete friendships" ON public.friendships
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Blocked Users: blocker can manage
CREATE POLICY "Users can see their blocks" ON public.blocked_users
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others" ON public.blocked_users
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock" ON public.blocked_users
  FOR DELETE USING (auth.uid() = blocker_id);

-- Conversations: only participants
CREATE POLICY "Participants can see conversations" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (true);

-- Conversation Participants
CREATE POLICY "Participants can see participants" ON public.conversation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join conversations" ON public.conversation_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own read status" ON public.conversation_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Messages: only conversation participants
CREATE POLICY "Participants can see messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

-- Notifications: only recipient
CREATE POLICY "Users can see their notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Activity Events: only the user
CREATE POLICY "Users can see their activity" ON public.activity_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity events" ON public.activity_events
  FOR INSERT WITH CHECK (true);

-- Push Tokens
CREATE POLICY "Users can manage their push tokens" ON public.push_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Enable Realtime for messages and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
```

**Step 2: Create seed data for development**

```sql
-- supabase/seed.sql
-- Development seed data - run manually via Supabase SQL editor
-- This creates test users for development. In production, users register normally.
-- NOTE: Actual seed data will be created through the app during development.
-- This file is a placeholder for future seeding needs.
```

**Step 3: Apply migration to Supabase**

Run the migration SQL in the Supabase Dashboard SQL Editor, or use the Supabase CLI:

```bash
npx supabase init  # if not already done
npx supabase db push
```

**Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: add database schema migration with RLS policies"
```

---

### Task 6: Validation Schemas (Zod)

**Files:**
- Create: `josical-app/src/lib/validation.ts`

**Step 1: Create validation schemas**

```typescript
// src/lib/validation.ts

import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Please enter a valid email').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
})

export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim().optional(),
  bio: z.string().max(200, 'Bio must be 200 characters or less').trim().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
})

export const dogSchema = z.object({
  name: z.string().min(1, 'Dog name is required').trim(),
  breed: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  age_category: z.enum(['puppy', 'adult', 'senior']).optional(),
  is_neutered: z.boolean().optional(),
})

export const preferencesSchema = z.object({
  discovery_radius: z.number().min(0.5).max(10),
  is_discoverable: z.boolean(),
})

export const messageSchema = z.object({
  type: z.enum(['text', 'image', 'location']),
  content: z.string().min(1).max(2000),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type DogInput = z.infer<typeof dogSchema>
export type PreferencesInput = z.infer<typeof preferencesSchema>
export type MessageInput = z.infer<typeof messageSchema>
```

**Step 2: Commit**

```bash
git add src/lib/validation.ts
git commit -m "feat: add Zod validation schemas for auth, profile, dogs, messages"
```

---

### Task 7: Auth Store (Zustand)

**Files:**
- Create: `josical-app/src/stores/authStore.ts`

**Step 1: Create auth store**

```typescript
// src/stores/authStore.ts

import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { UserProfile } from '../types'
import type { Session } from '@supabase/supabase-js'

type AuthState = {
  readonly session: Session | null
  readonly profile: UserProfile | null
  readonly isLoading: boolean
  readonly isInitialized: boolean
}

type AuthActions = {
  readonly initialize: () => Promise<void>
  readonly register: (name: string, email: string, password: string) => Promise<void>
  readonly login: (email: string, password: string) => Promise<void>
  readonly logout: () => Promise<void>
  readonly fetchProfile: () => Promise<void>
  readonly setProfile: (profile: UserProfile) => void
  readonly resetPassword: (email: string) => Promise<void>
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  session: null,
  profile: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      set({ session, isInitialized: true })

      if (session) {
        await get().fetchProfile()
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session })
        if (session) {
          get().fetchProfile()
        } else {
          set({ profile: null })
        }
      })
    } catch (error) {
      console.error('Auth initialization failed:', error)
      set({ isInitialized: true })
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
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

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      set({ session: data.session })
      await get().fetchProfile()
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    set({ session: null, profile: null })
  },

  fetchProfile: async () => {
    const session = get().session
    if (!session) return

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error) throw error
    set({ profile: data })
  },

  setProfile: (profile) => set({ profile }),

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  },
}))
```

**Step 2: Commit**

```bash
git add src/stores/authStore.ts
git commit -m "feat: add Zustand auth store with Supabase auth integration"
```

---

### Task 8: Static Data (Locations & Breeds)

**Files:**
- Create: `josical-app/src/constants/locations.ts`
- Create: `josical-app/src/constants/breeds.ts`

**Step 1: Create Israeli cities/neighborhoods with coordinates**

```typescript
// src/constants/locations.ts

export type Location = {
  readonly city: string
  readonly neighborhoods: readonly string[]
  readonly lat: number
  readonly lng: number
}

export const LOCATIONS: readonly Location[] = [
  {
    city: 'Tel Aviv',
    neighborhoods: ['Florentin', 'Neve Tzedek', 'Rothschild', 'Dizengoff', 'Sarona', 'Jaffa', 'Ramat Aviv', 'Old North', 'Lev Ha\'Ir', 'HaTikva', 'Neve Sha\'anan'],
    lat: 32.0853,
    lng: 34.7818,
  },
  {
    city: 'Jerusalem',
    neighborhoods: ['Rehavia', 'German Colony', 'Baka', 'Talpiot', 'Katamon', 'Ein Kerem', 'Mahane Yehuda', 'City Center'],
    lat: 31.7683,
    lng: 35.2137,
  },
  {
    city: 'Haifa',
    neighborhoods: ['Carmel Center', 'German Colony', 'Downtown', 'Bat Galim', 'Neve Sha\'anan', 'Ahuza'],
    lat: 32.7940,
    lng: 34.9896,
  },
  {
    city: 'Rishon LeZion',
    neighborhoods: ['City Center', 'Nahalat Yehuda', 'Neve Hof', 'Kiryat Rishon'],
    lat: 31.9500,
    lng: 34.8000,
  },
  {
    city: 'Petah Tikva',
    neighborhoods: ['City Center', 'Kfar Ganim', 'Em HaMoshavot', 'Neve Oz'],
    lat: 32.0868,
    lng: 34.8876,
  },
  {
    city: 'Ashdod',
    neighborhoods: ['City Center', 'Rova Yud', 'Marina', 'Rova Alef'],
    lat: 31.8014,
    lng: 34.6435,
  },
  {
    city: 'Netanya',
    neighborhoods: ['City Center', 'South Beach', 'Kiryat Nordau', 'Ir Yamim'],
    lat: 32.3215,
    lng: 34.8532,
  },
  {
    city: 'Beersheba',
    neighborhoods: ['Old City', 'Neve Noy', 'Ramot', 'Neve Ze\'ev'],
    lat: 31.2530,
    lng: 34.7915,
  },
  {
    city: 'Holon',
    neighborhoods: ['City Center', 'Neve Rabin', 'Kiryat Sharet', 'Jesse Cohen'],
    lat: 32.0114,
    lng: 34.7748,
  },
  {
    city: 'Ramat Gan',
    neighborhoods: ['City Center', 'Diamond Exchange', 'Neve Yehoshua', 'Kiryat Krinitzi'],
    lat: 32.0700,
    lng: 34.8243,
  },
  {
    city: 'Herzliya',
    neighborhoods: ['Herzliya Pituach', 'City Center', 'Neve Amal', 'Nof Yam'],
    lat: 32.1629,
    lng: 34.8447,
  },
  {
    city: 'Kfar Saba',
    neighborhoods: ['City Center', 'Green', 'Neve Yerek'],
    lat: 32.1780,
    lng: 34.9066,
  },
  {
    city: 'Ra\'anana',
    neighborhoods: ['City Center', 'Neve Zemer', 'North Ra\'anana'],
    lat: 32.1849,
    lng: 34.8709,
  },
  {
    city: 'Bat Yam',
    neighborhoods: ['City Center', 'Beach Area', 'Pardes'],
    lat: 32.0236,
    lng: 34.7510,
  },
  {
    city: 'Rehovot',
    neighborhoods: ['City Center', 'Neve Amal', 'Kiryat Weizmann'],
    lat: 31.8928,
    lng: 34.8113,
  },
  {
    city: 'Modiin',
    neighborhoods: ['Buchman', 'Moriah', 'Avnei Tan', 'Yehalom'],
    lat: 31.8969,
    lng: 35.0104,
  },
  {
    city: 'Givatayim',
    neighborhoods: ['City Center', 'Borochov', 'Neve Golan'],
    lat: 32.0718,
    lng: 34.8103,
  },
  {
    city: 'Eilat',
    neighborhoods: ['City Center', 'North Beach', 'Arava'],
    lat: 29.5577,
    lng: 34.9519,
  },
] as const

export const getCityNames = (): readonly string[] =>
  LOCATIONS.map((loc) => loc.city)

export const getNeighborhoods = (city: string): readonly string[] => {
  const location = LOCATIONS.find((loc) => loc.city === city)
  return location?.neighborhoods ?? []
}

export const getLocationCoords = (city: string): { lat: number; lng: number } | null => {
  const location = LOCATIONS.find((loc) => loc.city === city)
  return location ? { lat: location.lat, lng: location.lng } : null
}
```

**Step 2: Create dog breeds list** (abbreviated — full list has 200+ breeds)

```typescript
// src/constants/breeds.ts

export const DOG_BREEDS: readonly string[] = [
  'Affenpinscher',
  'Afghan Hound',
  'Airedale Terrier',
  'Akita',
  'Alaskan Malamute',
  'American Bulldog',
  'American Cocker Spaniel',
  'American Pit Bull Terrier',
  'American Staffordshire Terrier',
  'Australian Cattle Dog',
  'Australian Shepherd',
  'Basenji',
  'Basset Hound',
  'Beagle',
  'Belgian Malinois',
  'Bernese Mountain Dog',
  'Bichon Frise',
  'Bloodhound',
  'Border Collie',
  'Border Terrier',
  'Boston Terrier',
  'Boxer',
  'Brittany',
  'Brussels Griffon',
  'Bull Terrier',
  'Bulldog',
  'Bullmastiff',
  'Cairn Terrier',
  'Canaan Dog',
  'Cane Corso',
  'Cavalier King Charles Spaniel',
  'Chesapeake Bay Retriever',
  'Chihuahua',
  'Chinese Crested',
  'Chinese Shar-Pei',
  'Chow Chow',
  'Cocker Spaniel',
  'Collie',
  'Corgi (Pembroke Welsh)',
  'Corgi (Cardigan Welsh)',
  'Dachshund',
  'Dalmatian',
  'Doberman Pinscher',
  'English Setter',
  'English Springer Spaniel',
  'French Bulldog',
  'German Pinscher',
  'German Shepherd',
  'German Shorthaired Pointer',
  'Golden Retriever',
  'Gordon Setter',
  'Great Dane',
  'Great Pyrenees',
  'Greyhound',
  'Havanese',
  'Irish Setter',
  'Irish Wolfhound',
  'Italian Greyhound',
  'Jack Russell Terrier',
  'Japanese Chin',
  'Keeshond',
  'Kerry Blue Terrier',
  'Labrador Retriever',
  'Lhasa Apso',
  'Maltese',
  'Maltipoo',
  'Miniature Pinscher',
  'Miniature Schnauzer',
  'Mixed Breed',
  'Newfoundland',
  'Norfolk Terrier',
  'Norwegian Elkhound',
  'Old English Sheepdog',
  'Papillon',
  'Pekingese',
  'Pointer',
  'Pomeranian',
  'Poodle (Miniature)',
  'Poodle (Standard)',
  'Poodle (Toy)',
  'Portuguese Water Dog',
  'Pug',
  'Rhodesian Ridgeback',
  'Rottweiler',
  'Saint Bernard',
  'Saluki',
  'Samoyed',
  'Schnauzer (Giant)',
  'Schnauzer (Standard)',
  'Scottish Terrier',
  'Shetland Sheepdog',
  'Shiba Inu',
  'Shih Tzu',
  'Siberian Husky',
  'Soft Coated Wheaten Terrier',
  'Staffordshire Bull Terrier',
  'Tibetan Mastiff',
  'Tibetan Terrier',
  'Vizsla',
  'Weimaraner',
  'West Highland White Terrier',
  'Whippet',
  'Wire Fox Terrier',
  'Yorkshire Terrier',
] as const

export const searchBreeds = (query: string): readonly string[] => {
  if (query.length < 2) return []
  const lower = query.toLowerCase()
  return DOG_BREEDS.filter((breed) => breed.toLowerCase().includes(lower))
}
```

**Step 3: Commit**

```bash
git add src/constants/locations.ts src/constants/breeds.ts
git commit -m "feat: add Israeli locations and dog breeds static data"
```

---

### Task 9: Utility Functions

**Files:**
- Create: `josical-app/src/lib/distance.ts`
- Create: `josical-app/src/hooks/useDebounce.ts`

**Step 1: Haversine distance calculation**

```typescript
// src/lib/distance.ts

const EARTH_RADIUS_KM = 6371

const toRadians = (degrees: number): number => degrees * (Math.PI / 180)

export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}

export const formatDistance = (km: number): string => {
  if (km < 1) return `${Math.round(km * 1000)}m away`
  return `${km.toFixed(1)} km away`
}
```

**Step 2: Debounce hook**

```typescript
// src/hooks/useDebounce.ts

import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
```

**Step 3: Commit**

```bash
git add src/lib/distance.ts src/hooks/useDebounce.ts
git commit -m "feat: add Haversine distance util and useDebounce hook"
```

---

### Task 10: Core UI Components

**Files:**
- Create: `josical-app/src/components/ui/Button.tsx`
- Create: `josical-app/src/components/ui/Input.tsx`
- Create: `josical-app/src/components/ui/Card.tsx`
- Create: `josical-app/src/components/ui/Avatar.tsx`
- Create: `josical-app/src/components/ui/index.ts`

**Step 1: Button component**

```typescript
// src/components/ui/Button.tsx

import React from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native'
import { colors, borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'

type ButtonProps = {
  readonly title: string
  readonly onPress: () => void
  readonly variant?: ButtonVariant
  readonly isLoading?: boolean
  readonly disabled?: boolean
  readonly style?: ViewStyle
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || isLoading

  return (
    <TouchableOpacity
      style={[styles.base, variantStyles[variant], isDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.white : colors.primary}
          size="small"
        />
      ) : (
        <Text style={[styles.text, textVariantStyles[variant], isDisabled && styles.disabledText]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  text: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
})

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.primaryLight,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
}

const textVariantStyles: Record<ButtonVariant, TextStyle> = {
  primary: {
    color: colors.white,
  },
  secondary: {
    color: colors.primary,
  },
  outline: {
    color: colors.primary,
  },
  ghost: {
    color: colors.primary,
  },
}
```

**Step 2: Input component**

```typescript
// src/components/ui/Input.tsx

import React, { useState } from 'react'
import { View, TextInput, Text, StyleSheet, type TextInputProps } from 'react-native'
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme'

type InputProps = TextInputProps & {
  readonly label?: string
  readonly error?: string
}

export function Input({ label, error, style, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error ? styles.inputError : undefined,
          style,
        ]}
        placeholderTextColor={colors.textLight}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.white,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    fontSize: fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
})
```

**Step 3: Card component**

```typescript
// src/components/ui/Card.tsx

import React, { type ReactNode } from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import { colors, borderRadius, spacing, shadow } from '../../constants/theme'

type CardProps = {
  readonly children: ReactNode
  readonly style?: ViewStyle
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadow.md,
  },
})
```

**Step 4: Avatar component**

```typescript
// src/components/ui/Avatar.tsx

import React from 'react'
import { View, Image, Text, StyleSheet } from 'react-native'
import { colors, borderRadius } from '../../constants/theme'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

type AvatarProps = {
  readonly uri?: string | null
  readonly name?: string
  readonly size?: AvatarSize
}

const SIZE_MAP: Record<AvatarSize, number> = {
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96,
}

const FONT_SIZE_MAP: Record<AvatarSize, number> = {
  sm: 14,
  md: 18,
  lg: 24,
  xl: 36,
}

export function Avatar({ uri, name, size = 'md' }: AvatarProps) {
  const dimension = SIZE_MAP[size]

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: dimension, height: dimension, borderRadius: dimension / 2 }]}
      />
    )
  }

  const initials = name
    ? name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <View
      style={[
        styles.fallback,
        { width: dimension, height: dimension, borderRadius: dimension / 2 },
      ]}
    >
      <Text style={[styles.initials, { fontSize: FONT_SIZE_MAP[size] }]}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.gray[200],
  },
  fallback: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.primary,
    fontWeight: '600',
  },
})
```

**Step 5: Barrel export**

```typescript
// src/components/ui/index.ts

export { Button } from './Button'
export { Input } from './Input'
export { Card } from './Card'
export { Avatar } from './Avatar'
```

**Step 6: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add core UI components (Button, Input, Card, Avatar)"
```

---

### Task 11: Navigation Types & Auth Navigator

**Files:**
- Create: `josical-app/src/app/navigation/types.ts`
- Create: `josical-app/src/app/navigation/AuthNavigator.tsx`

**Step 1: Navigation type definitions**

```typescript
// src/app/navigation/types.ts

import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'

export type AuthStackParamList = {
  Welcome: undefined
  Login: undefined
  Register: undefined
  ForgotPassword: undefined
}

export type OnboardingStackParamList = {
  ProfileSetup: undefined
  DogSetup: undefined
  Preferences: undefined
}

export type MainTabParamList = {
  Home: undefined
  Discover: undefined
  Messages: undefined
  Friends: undefined
  Profile: undefined
}

export type HomeStackParamList = {
  HomeScreen: undefined
  Notifications: undefined
}

export type DiscoverStackParamList = {
  DiscoverScreen: undefined
  UserProfile: { userId: string }
}

export type MessagesStackParamList = {
  ConversationsList: undefined
  Chat: { conversationId: string; friendName: string }
  NewConversation: undefined
}

export type FriendsStackParamList = {
  FriendsList: undefined
  Requests: undefined
  Suggestions: undefined
  UserProfile: { userId: string }
}

export type ProfileStackParamList = {
  MyProfile: undefined
  EditProfile: undefined
  DogProfile: { dogId?: string }
  Settings: undefined
  BlockedUsers: undefined
}

// Screen props helpers
export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>

export type OnboardingScreenProps<T extends keyof OnboardingStackParamList> =
  NativeStackScreenProps<OnboardingStackParamList, T>

export type MainTabProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>
```

**Step 2: Auth Navigator**

```typescript
// src/app/navigation/AuthNavigator.tsx

import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { WelcomeScreen } from '../screens/auth/WelcomeScreen'
import { LoginScreen } from '../screens/auth/LoginScreen'
import { RegisterScreen } from '../screens/auth/RegisterScreen'
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen'
import type { AuthStackParamList } from './types'

const Stack = createNativeStackNavigator<AuthStackParamList>()

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  )
}
```

**Step 3: Commit**

```bash
git add src/app/navigation/
git commit -m "feat: add navigation types and AuthNavigator"
```

---

### Task 12: Welcome Screen

**Files:**
- Create: `josical-app/src/app/screens/auth/WelcomeScreen.tsx`

**Step 1: Build Welcome screen with logo and auth buttons**

```typescript
// src/app/screens/auth/WelcomeScreen.tsx

import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '../../../components/ui'
import { colors, spacing, fontSize, fontWeight } from '../../../constants/theme'
import type { AuthScreenProps } from '../../navigation/types'

export function WelcomeScreen({ navigation }: AuthScreenProps<'Welcome'>) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.tagline}>
          The Social Platform for Dog Owners
        </Text>

        <Text style={styles.subtitle}>
          Connect with dog owners near you.{'\n'}
          Discover neighbors. Build your community.
        </Text>
      </View>

      <View style={styles.buttons}>
        <Button
          title="Sign Up"
          onPress={() => navigation.navigate('Register')}
          variant="primary"
        />
        <Button
          title="Log In"
          onPress={() => navigation.navigate('Login')}
          variant="outline"
          style={styles.loginButton}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logo: {
    width: 180,
    height: 180,
  },
  tagline: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttons: {
    paddingBottom: spacing.xl,
  },
  loginButton: {
    marginTop: spacing.sm,
  },
})
```

**Step 2: Copy the JoSial logo to assets folder**

```bash
cp "/Users/omerhanoh/Desktop/עומר/Projects/Josical V1/Designs/Logo /my-project-page-1 (1).png" josical-app/assets/logo.png
```

**Step 3: Commit**

```bash
git add src/app/screens/auth/WelcomeScreen.tsx assets/logo.png
git commit -m "feat: add Welcome screen with logo and auth buttons"
```

---

### Task 13: Register Screen

**Files:**
- Create: `josical-app/src/app/screens/auth/RegisterScreen.tsx`

**Step 1: Build registration form with validation**

```typescript
// src/app/screens/auth/RegisterScreen.tsx

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Input } from '../../../components/ui'
import { colors, spacing, fontSize, fontWeight } from '../../../constants/theme'
import { registerSchema } from '../../../lib/validation'
import { useAuthStore } from '../../../stores/authStore'
import type { AuthScreenProps } from '../../navigation/types'

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { register, isLoading } = useAuthStore()

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const { [field]: _, ...rest } = prev
      return rest
    })
  }

  const handleRegister = async () => {
    const result = registerSchema.safeParse(form)

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string
        fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    try {
      await register(result.data.name, result.data.email, result.data.password)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed'
      Alert.alert('Registration Error', message)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the dog owner community</Text>

          <Input
            label="Full Name"
            placeholder="Your name"
            value={form.name}
            onChangeText={(v) => updateField('name', v)}
            error={errors.name}
            autoCapitalize="words"
            autoComplete="name"
          />

          <Input
            label="Email Address"
            placeholder="you@example.com"
            value={form.email}
            onChangeText={(v) => updateField('email', v)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Input
            label="Password"
            placeholder="Min. 6 characters"
            value={form.password}
            onChangeText={(v) => updateField('password', v)}
            error={errors.password}
            secureTextEntry
          />

          <Input
            label="Confirm Password"
            placeholder="Repeat your password"
            value={form.confirmPassword}
            onChangeText={(v) => updateField('confirmPassword', v)}
            error={errors.confirmPassword}
            secureTextEntry
          />

          <Button
            title="Create Account"
            onPress={handleRegister}
            isLoading={isLoading}
            style={styles.registerButton}
          />

          <Button
            title="Already have an account? Log In"
            onPress={() => navigation.navigate('Login')}
            variant="ghost"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  registerButton: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
})
```

**Step 2: Commit**

```bash
git add src/app/screens/auth/RegisterScreen.tsx
git commit -m "feat: add Register screen with form validation"
```

---

### Task 14: Login Screen

**Files:**
- Create: `josical-app/src/app/screens/auth/LoginScreen.tsx`

**Step 1: Build login form**

```typescript
// src/app/screens/auth/LoginScreen.tsx

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Input } from '../../../components/ui'
import { colors, spacing, fontSize, fontWeight } from '../../../constants/theme'
import { loginSchema } from '../../../lib/validation'
import { useAuthStore } from '../../../stores/authStore'
import type { AuthScreenProps } from '../../navigation/types'

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { login, isLoading } = useAuthStore()

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const { [field]: _, ...rest } = prev
      return rest
    })
  }

  const handleLogin = async () => {
    const result = loginSchema.safeParse(form)

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string
        fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    try {
      await login(result.data.email, result.data.password)
    } catch (error) {
      Alert.alert('Login Error', 'Invalid email or password')
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Log in to your account</Text>

          <Input
            label="Email Address"
            placeholder="you@example.com"
            value={form.email}
            onChangeText={(v) => updateField('email', v)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Input
            label="Password"
            placeholder="Your password"
            value={form.password}
            onChangeText={(v) => updateField('password', v)}
            error={errors.password}
            secureTextEntry
          />

          <Button
            title="Log In"
            onPress={handleLogin}
            isLoading={isLoading}
            style={styles.loginButton}
          />

          <Button
            title="Forgot Password?"
            onPress={() => navigation.navigate('ForgotPassword')}
            variant="ghost"
          />

          <Button
            title="Don't have an account? Sign Up"
            onPress={() => navigation.navigate('Register')}
            variant="ghost"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  loginButton: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
})
```

**Step 2: Commit**

```bash
git add src/app/screens/auth/LoginScreen.tsx
git commit -m "feat: add Login screen with form validation"
```

---

### Task 15: Forgot Password Screen

**Files:**
- Create: `josical-app/src/app/screens/auth/ForgotPasswordScreen.tsx`

**Step 1: Build forgot password screen**

```typescript
// src/app/screens/auth/ForgotPasswordScreen.tsx

import React, { useState } from 'react'
import { View, Text, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Input } from '../../../components/ui'
import { colors, spacing, fontSize, fontWeight } from '../../../constants/theme'
import { useAuthStore } from '../../../stores/authStore'
import type { AuthScreenProps } from '../../navigation/types'

export function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const { resetPassword } = useAuthStore()

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address')
      return
    }

    setIsLoading(true)
    try {
      await resetPassword(email.trim().toLowerCase())
      setIsSent(true)
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We sent a password reset link to {email}. Follow the instructions in the email to reset your password.
          </Text>
          <Button
            title="Back to Login"
            onPress={() => navigation.navigate('Login')}
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your password.
        </Text>

        <Input
          label="Email Address"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <Button
          title="Send Reset Link"
          onPress={handleReset}
          isLoading={isLoading}
          style={styles.button}
        />

        <Button
          title="Back to Login"
          onPress={() => navigation.navigate('Login')}
          variant="ghost"
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  content: {
    paddingTop: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  button: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
})
```

**Step 2: Commit**

```bash
git add src/app/screens/auth/ForgotPasswordScreen.tsx
git commit -m "feat: add Forgot Password screen with Supabase reset flow"
```

---

### Task 16: Onboarding Screens (3-Step Wizard)

**Files:**
- Create: `josical-app/src/app/navigation/OnboardingNavigator.tsx`
- Create: `josical-app/src/app/screens/onboarding/ProfileSetupScreen.tsx`
- Create: `josical-app/src/app/screens/onboarding/DogSetupScreen.tsx`
- Create: `josical-app/src/app/screens/onboarding/PreferencesScreen.tsx`
- Create: `josical-app/src/stores/profileStore.ts`
- Create: `josical-app/src/stores/dogsStore.ts`

This is a large task. Implement each file in order. The full code for each screen is in the design doc. Key behaviors:

**ProfileSetupScreen**: Avatar picker (expo-image-picker), bio text input with 200-char counter, city dropdown, neighborhood dropdown (populates based on city). Saves to Supabase profiles table on "Next".

**DogSetupScreen**: Dog name (required), breed searchable picker, photo, gender toggle, age category selector, neutered toggle. "Add Another Dog" button. Saves each dog to Supabase dogs table. Must have at least one dog name to proceed.

**PreferencesScreen**: Discovery radius slider (0.5-10km), discoverability toggle, push notification permission request. On "Get Started": sets `onboarding_completed = true` and navigates to main app.

**OnboardingNavigator**: Stack navigator with the 3 screens. Progress bar component showing step 1/2/3.

**profileStore**: Zustand store with `updateProfile(data)` action that calls `supabase.from('profiles').update(data)`.

**dogsStore**: Zustand store with `addDog(data)`, `updateDog(id, data)`, `deleteDog(id)`, `fetchMyDogs()`.

**Commit after each screen is complete.**

---

### Task 17: Root Navigator & App Entry Point

**Files:**
- Create: `josical-app/src/app/navigation/RootNavigator.tsx`
- Modify: `josical-app/App.tsx`

**Step 1: Root Navigator with auth/onboarding routing**

```typescript
// src/app/navigation/RootNavigator.tsx

import React, { useEffect } from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { AuthNavigator } from './AuthNavigator'
import { OnboardingNavigator } from './OnboardingNavigator'
import { MainTabNavigator } from './MainTabNavigator'
import { useAuthStore } from '../../stores/authStore'
import { colors } from '../../constants/theme'

export function RootNavigator() {
  const { session, profile, isInitialized, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (!isInitialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const getNavigator = () => {
    if (!session) return <AuthNavigator />
    if (profile && !profile.onboarding_completed) return <OnboardingNavigator />
    return <MainTabNavigator />
  }

  return <NavigationContainer>{getNavigator()}</NavigationContainer>
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
})
```

**Step 2: Update App.tsx**

```typescript
// App.tsx

import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { RootNavigator } from './src/app/navigation/RootNavigator'

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </SafeAreaProvider>
  )
}
```

**Step 3: Commit**

```bash
git add src/app/navigation/RootNavigator.tsx App.tsx
git commit -m "feat: add RootNavigator with auth/onboarding/main routing"
```

---

## Phase 1: Social Connection

### Task 18: Main Tab Navigator

**Files:**
- Create: `josical-app/src/app/navigation/MainTabNavigator.tsx`

**Step 1: Build 5-tab navigator with icons**

Uses `@expo/vector-icons` (included with Expo). Tabs: Home, Discover, Messages, Friends, Profile. Each tab uses a stack navigator for sub-screens.

Install icon package if needed:
```bash
npx expo install @expo/vector-icons
```

```typescript
// src/app/navigation/MainTabNavigator.tsx

import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { HomeScreen } from '../screens/home/HomeScreen'
import { DiscoverScreen } from '../screens/discover/DiscoverScreen'
import { ConversationsScreen } from '../screens/messages/ConversationsScreen'
import { FriendsScreen } from '../screens/friends/FriendsScreen'
import { MyProfileScreen } from '../screens/profile/MyProfileScreen'
import { colors, fontSize } from '../../constants/theme'
import type { MainTabParamList } from './types'

const Tab = createBottomTabNavigator<MainTabParamList>()

const TAB_ICONS: Record<keyof MainTabParamList, { focused: string; default: string }> = {
  Home: { focused: 'home', default: 'home-outline' },
  Discover: { focused: 'compass', default: 'compass-outline' },
  Messages: { focused: 'chatbubbles', default: 'chatbubbles-outline' },
  Friends: { focused: 'people', default: 'people-outline' },
  Profile: { focused: 'person', default: 'person-outline' },
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name]
          const iconName = focused ? icons.focused : icons.default
          return <Ionicons name={iconName as any} size={size} color={color} />
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarLabelStyle: { fontSize: fontSize.xs },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Messages" component={ConversationsScreen} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="Profile" component={MyProfileScreen} />
    </Tab.Navigator>
  )
}
```

**Step 2: Create placeholder screens for each tab** (implement full screens in subsequent tasks)

Create minimal placeholder components for: `HomeScreen`, `DiscoverScreen`, `ConversationsScreen`, `FriendsScreen`, `MyProfileScreen` — each returning a `<View><Text>Screen Name</Text></View>`.

**Step 3: Commit**

```bash
git add src/app/navigation/MainTabNavigator.tsx src/app/screens/
git commit -m "feat: add MainTabNavigator with 5 tabs and placeholder screens"
```

---

### Task 19: Dogs Store & Profile Store

**Files:**
- Create: `josical-app/src/stores/dogsStore.ts`
- Create: `josical-app/src/stores/profileStore.ts`

Implement Zustand stores as described in Task 16. Key actions:

**profileStore**: `fetchProfile()`, `updateProfile(data)`, `updatePreferences(data)`
**dogsStore**: `fetchMyDogs()`, `addDog(data)`, `updateDog(id, data)`, `deleteDog(id)`, `fetchUserDogs(userId)`

Both stores use Supabase client directly. All state updates return new objects (immutability).

**Commit after implementation.**

---

### Task 20: Friends Store

**Files:**
- Create: `josical-app/src/stores/friendsStore.ts`

**Step 1: Create friends store**

```typescript
// src/stores/friendsStore.ts

import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { UserProfile, FriendRequest } from '../types'

type FriendsState = {
  readonly friends: readonly UserProfile[]
  readonly incomingRequests: readonly (FriendRequest & { from_user: UserProfile })[]
  readonly outgoingRequests: readonly FriendRequest[]
  readonly blockedUserIds: readonly string[]
  readonly isLoading: boolean
}

type FriendsActions = {
  readonly fetchFriends: () => Promise<void>
  readonly fetchIncomingRequests: () => Promise<void>
  readonly fetchOutgoingRequests: () => Promise<void>
  readonly fetchBlockedUsers: () => Promise<void>
  readonly sendRequest: (toUserId: string) => Promise<void>
  readonly acceptRequest: (requestId: string) => Promise<void>
  readonly declineRequest: (requestId: string) => Promise<void>
  readonly cancelRequest: (requestId: string) => Promise<void>
  readonly unfriend: (friendId: string) => Promise<void>
  readonly blockUser: (userId: string) => Promise<void>
  readonly unblockUser: (userId: string) => Promise<void>
}

export const useFriendsStore = create<FriendsState & FriendsActions>((set, get) => ({
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
  blockedUserIds: [],
  isLoading: false,

  fetchFriends: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('friendships')
      .select('friend_id, profiles:friend_id(*)')
      .eq('user_id', user.id)

    if (error) throw error
    const friends = (data ?? []).map((row: any) => row.profiles as UserProfile)
    set({ friends })
  },

  fetchIncomingRequests: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('friend_requests')
      .select('*, from_user:from_user_id(*)')
      .eq('to_user_id', user.id)
      .eq('status', 'pending')

    if (error) throw error
    set({ incomingRequests: data ?? [] })
  },

  fetchOutgoingRequests: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('from_user_id', user.id)
      .eq('status', 'pending')

    if (error) throw error
    set({ outgoingRequests: data ?? [] })
  },

  fetchBlockedUsers: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('blocked_users')
      .select('blocked_id')
      .eq('blocker_id', user.id)

    if (error) throw error
    set({ blockedUserIds: (data ?? []).map((row) => row.blocked_id) })
  },

  sendRequest: async (toUserId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('friend_requests')
      .insert({ from_user_id: user.id, to_user_id: toUserId })

    if (error) throw error
    await get().fetchOutgoingRequests()
  },

  acceptRequest: async (requestId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get the request to find the sender
    const { data: request, error: fetchError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !request) throw fetchError

    // Update request status
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)

    if (updateError) throw updateError

    // Create bilateral friendships
    const { error: friendError } = await supabase
      .from('friendships')
      .insert([
        { user_id: user.id, friend_id: request.from_user_id },
        { user_id: request.from_user_id, friend_id: user.id },
      ])

    if (friendError) throw friendError

    await Promise.all([get().fetchFriends(), get().fetchIncomingRequests()])
  },

  declineRequest: async (requestId) => {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'declined' })
      .eq('id', requestId)

    if (error) throw error
    await get().fetchIncomingRequests()
  },

  cancelRequest: async (requestId) => {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId)

    if (error) throw error
    await get().fetchOutgoingRequests()
  },

  unfriend: async (friendId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Delete bilateral friendships
    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)

    if (error) throw error
    await get().fetchFriends()
  },

  blockUser: async (userId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Block user
    const { error: blockError } = await supabase
      .from('blocked_users')
      .insert({ blocker_id: user.id, blocked_id: userId })

    if (blockError) throw blockError

    // Remove any existing friendship
    await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`)

    await Promise.all([get().fetchFriends(), get().fetchBlockedUsers()])
  },

  unblockUser: async (userId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', userId)

    if (error) throw error
    await get().fetchBlockedUsers()
  },
}))
```

**Step 2: Commit**

```bash
git add src/stores/friendsStore.ts
git commit -m "feat: add friends store with request, friendship, and block management"
```

---

### Task 21-27: Remaining Phase 1 Screens

Implement each screen following the patterns established in Tasks 12-15. Each screen should:
1. Use the existing UI components (`Button`, `Input`, `Card`, `Avatar`)
2. Use the relevant Zustand store for data
3. Follow the design specifications in the design doc
4. Commit after each screen

**Task 21**: `DiscoverScreen.tsx` — Query profiles by distance, UserCard list, radius filter bottom sheet, search bar
**Task 22**: `UserProfileScreen.tsx` — View another user's profile with dogs, distance, Add Friend / Message buttons
**Task 23**: `HomeScreen.tsx` — Greeting header, dog carousel (horizontal FlatList), activity timeline (vertical FlatList)
**Task 24**: `FriendsScreen.tsx` — Friends list with search, tabs for All/Requests/Suggestions
**Task 25**: `RequestsScreen.tsx` — Incoming/outgoing request cards with Accept/Decline/Cancel actions
**Task 26**: `SuggestionsScreen.tsx` — Nearby non-friend users as suggestion cards with Add Friend button
**Task 27**: `MyProfileScreen.tsx` + `EditProfileScreen.tsx` + `DogProfileScreen.tsx` + `SettingsScreen.tsx`

---

## Phase 2: Real-Time Messaging

### Task 28: Chat Store & Realtime Hook

**Files:**
- Create: `josical-app/src/stores/chatStore.ts`
- Create: `josical-app/src/hooks/useRealtime.ts`

**chatStore** actions: `fetchConversations()`, `fetchMessages(conversationId)`, `sendMessage(conversationId, type, content)`, `createConversation(participantId)`, `markAsRead(conversationId)`, `getUnreadCount()`

**useRealtime** hook: Subscribes to Supabase Realtime channel for a conversation, calls callback on new messages. Cleans up subscription on unmount.

---

### Task 29: Notification Store

**Files:**
- Create: `josical-app/src/stores/notificationStore.ts`

Actions: `fetchNotifications()`, `markAsRead(id)`, `getUnreadCount()`, realtime subscription for new notifications.

---

### Task 30-33: Messaging Screens

**Task 30**: `ConversationsScreen.tsx` — Conversation list with realtime updates, unread badges, swipe-to-delete
**Task 31**: `NewConversationScreen.tsx` — Friends search, tap to start/find conversation
**Task 32**: `ChatScreen.tsx` — Message list with realtime subscription, send input, image picker, read receipts
**Task 33**: Push notification setup — Register Expo push token, store in `push_tokens` table, handle incoming notifications

---

### Task 34: Supabase Edge Function for Push Notifications

**Files:**
- Create: `josical-app/supabase/functions/push-notification/index.ts`

Edge Function triggered by database webhook on `messages` INSERT. Looks up recipient's push token, sends via Expo Push API. Suppresses if recipient is currently viewing the conversation.

---

### Task 35: Final Integration & Polish

- Wire up all navigation stacks (each tab gets its own stack navigator for sub-screens)
- Add notification bell icon to headers with unread badge count
- Test complete user flow: register → onboarding → discover → add friend → chat
- Seed development data for testing
- Commit all remaining changes

```bash
git add .
git commit -m "feat: complete MVP integration with all screens and navigation"
```

---

## Summary

| Phase | Tasks | Key Deliverables |
|---|---|---|
| Phase 0 | 1-17 | Project setup, Supabase schema, auth flow, onboarding wizard |
| Phase 1 | 18-27 | Tab navigation, discover, friends, home feed, profiles, settings |
| Phase 2 | 28-35 | Real-time chat, push notifications, conversation management |

**Total**: ~35 tasks, each 2-15 minutes.

**Critical path**: Tasks 1-5 (infrastructure) must complete first. After that, Phase 0 screens can be built in parallel with Phase 1 stores.
