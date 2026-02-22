import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Message, UserProfile } from '../types'
import type { RealtimeChannel } from '@supabase/supabase-js'

type ConversationPreview = {
  readonly id: string
  readonly updated_at: string
  readonly participant: UserProfile
  readonly lastMessage: Message | null
  readonly unreadCount: number
}

type ChatState = {
  readonly conversations: readonly ConversationPreview[]
  readonly messages: readonly Message[]
  readonly isLoadingConversations: boolean
  readonly isLoadingMessages: boolean
  readonly activeConversationId: string | null
}

type ChatActions = {
  readonly fetchConversations: () => Promise<void>
  readonly fetchMessages: (conversationId: string) => Promise<void>
  readonly sendMessage: (conversationId: string, content: string, type?: 'text' | 'image') => Promise<void>
  readonly findOrCreateConversation: (friendId: string) => Promise<string>
  readonly markAsRead: (conversationId: string) => Promise<void>
  readonly deleteConversation: (conversationId: string) => Promise<void>
  readonly setActiveConversation: (conversationId: string | null) => void
  readonly subscribeToMessages: (conversationId: string) => RealtimeChannel
  readonly subscribeToConversations: () => RealtimeChannel
  readonly clearMessages: () => void
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  conversations: [],
  messages: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  activeConversationId: null,

  fetchConversations: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    set({ isLoadingConversations: true })
    try {
      const { data: participantRows, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id)

      if (partError) throw partError
      if (!participantRows?.length) {
        set({ conversations: [] })
        return
      }

      const conversationIds = participantRows.map((r) => r.conversation_id)

      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false })

      if (convError) throw convError

      const { data: allParticipants, error: allPartError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id, last_read_at, profiles:user_id(*)')
        .in('conversation_id', conversationIds)

      if (allPartError) throw allPartError

      const { data: lastMessages, error: msgError } = await supabase
        .rpc('get_last_messages', { conversation_ids: conversationIds })

      const lastMessageMap = new Map<string, Message>()
      if (!msgError && lastMessages) {
        for (const msg of lastMessages) {
          lastMessageMap.set(msg.conversation_id, msg)
        }
      }

      const previews: ConversationPreview[] = (conversations ?? []).map((conv) => {
        const participants = (allParticipants ?? []).filter(
          (p) => p.conversation_id === conv.id
        )
        const otherParticipant = participants.find((p) => p.user_id !== user.id)
        const myParticipant = participants.find((p) => p.user_id === user.id)
        const lastMessage = lastMessageMap.get(conv.id) ?? null

        let unreadCount = 0
        if (lastMessage && myParticipant) {
          if (!myParticipant.last_read_at || myParticipant.last_read_at < lastMessage.created_at) {
            unreadCount = 1
          }
        }

        return {
          id: conv.id,
          updated_at: conv.updated_at,
          participant: (otherParticipant as any)?.profiles as UserProfile,
          lastMessage,
          unreadCount,
        }
      }).filter((p) => p.participant != null)

      set({ conversations: previews })
    } finally {
      set({ isLoadingConversations: false })
    }
  },

  fetchMessages: async (conversationId) => {
    set({ isLoadingMessages: true })
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error
      set({ messages: data ?? [] })
    } finally {
      set({ isLoadingMessages: false })
    }
  },

  sendMessage: async (conversationId, content, type = 'text') => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        type,
      })
      .select()
      .single()

    if (error) throw error

    set((state) => ({
      messages: [...state.messages, data],
    }))
  },

  findOrCreateConversation: async (friendId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: myConvos, error: myError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id)

    if (myError) throw myError

    if (myConvos?.length) {
      const myConvoIds = myConvos.map((c) => c.conversation_id)

      const { data: friendConvos, error: friendError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', friendId)
        .in('conversation_id', myConvoIds)

      if (friendError) throw friendError

      if (friendConvos?.length) {
        return friendConvos[0].conversation_id
      }
    }

    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single()

    if (convError) throw convError

    const { error: partError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: newConv.id, user_id: user.id },
        { conversation_id: newConv.id, user_id: friendId },
      ])

    if (partError) throw partError

    return newConv.id
  },

  markAsRead: async (conversationId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)

    if (error) throw error

    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ),
    }))
  },

  deleteConversation: async (conversationId) => {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)

    if (error) throw error

    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== conversationId),
    }))
  },

  setActiveConversation: (conversationId) => {
    set({ activeConversationId: conversationId })
  },

  subscribeToMessages: (conversationId) => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          const { data: { user } } = supabase.auth.getUser() as any
          const currentMessages = get().messages
          const alreadyExists = currentMessages.some((m) => m.id === newMessage.id)
          if (!alreadyExists) {
            set((state) => ({
              messages: [...state.messages, newMessage],
            }))
          }
        }
      )
      .subscribe()

    return channel
  },

  subscribeToConversations: () => {
    const channel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          get().fetchConversations()
        }
      )
      .subscribe()

    return channel
  },

  clearMessages: () => {
    set({ messages: [], activeConversationId: null })
  },
}))
