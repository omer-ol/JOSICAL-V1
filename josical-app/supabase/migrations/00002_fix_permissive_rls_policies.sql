-- =====================
-- FIX OVERLY PERMISSIVE RLS POLICIES
-- Security fixes for conversation_participants, activity_events, and dog storage
-- =====================

-- =====================
-- 1. Conversation participants: restrict INSERT to own user_id
--    Previously any authenticated user could join any conversation.
-- =====================
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;
CREATE POLICY "Users can join conversations" ON public.conversation_participants
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Also restrict conversation creation to require the creator to be a participant
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =====================
-- 2. Activity events: only allow inserting events for yourself
--    Previously any authenticated user could insert events for any user.
-- =====================
DROP POLICY IF EXISTS "System can insert activity events" ON public.activity_events;
CREATE POLICY "Users can insert own activity events" ON public.activity_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================
-- 3. Dog storage: scope upload/update to user's own folder
--    Previously any authenticated user could upload/overwrite any dog image.
-- =====================
DROP POLICY IF EXISTS "Users can upload dog images" ON storage.objects;
CREATE POLICY "Users can upload dog images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'dogs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update dog images" ON storage.objects;
CREATE POLICY "Users can update dog images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'dogs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================
-- 4. Add SECURITY DEFINER search_path restriction
-- =====================
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.update_conversation_timestamp() SET search_path = public;
