-- =====================
-- JOSIAL MVP SCHEMA
-- =====================

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

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Dogs are viewable by everyone" ON public.dogs FOR SELECT USING (true);
CREATE POLICY "Users can insert own dogs" ON public.dogs FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own dogs" ON public.dogs FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own dogs" ON public.dogs FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Users can see their friend requests" ON public.friend_requests FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users can send friend requests" ON public.friend_requests FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Involved users can update friend requests" ON public.friend_requests FOR UPDATE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can see their friendships" ON public.friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can insert friendships" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can delete friendships" ON public.friendships FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can see their blocks" ON public.blocked_users FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users can block others" ON public.blocked_users FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can unblock" ON public.blocked_users FOR DELETE USING (auth.uid() = blocker_id);

CREATE POLICY "Participants can see conversations" ON public.conversations FOR SELECT USING (EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = id AND user_id = auth.uid()));
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (true);

CREATE POLICY "Participants can see participants" ON public.conversation_participants FOR SELECT USING (EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid()));
CREATE POLICY "Users can join conversations" ON public.conversation_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own read status" ON public.conversation_participants FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Participants can see messages" ON public.messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()));
CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()));

CREATE POLICY "Users can see their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can see their activity" ON public.activity_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert activity events" ON public.activity_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage their push tokens" ON public.push_tokens FOR ALL USING (auth.uid() = user_id);

-- =====================
-- REALTIME
-- =====================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;

-- =====================
-- STORAGE BUCKETS
-- =====================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('dogs', 'dogs', true);

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Dog images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'dogs');
CREATE POLICY "Users can upload dog images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'dogs' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update dog images" ON storage.objects FOR UPDATE USING (bucket_id = 'dogs' AND auth.role() = 'authenticated');
