-- RPC function to get the last message for each conversation
-- Used by the chat store to build conversation previews efficiently
CREATE OR REPLACE FUNCTION public.get_last_messages(conversation_ids UUID[])
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  sender_id UUID,
  type TEXT,
  content TEXT,
  created_at TIMESTAMPTZ
) AS $$
  SELECT DISTINCT ON (m.conversation_id)
    m.id,
    m.conversation_id,
    m.sender_id,
    m.type,
    m.content,
    m.created_at
  FROM public.messages m
  WHERE m.conversation_id = ANY(conversation_ids)
  ORDER BY m.conversation_id, m.created_at DESC;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;
