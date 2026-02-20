import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { UserProfile, FriendRequest } from '../types'

type FriendRequestWithUser = FriendRequest & { readonly from_user: UserProfile }

type FriendsState = {
  readonly friends: readonly UserProfile[]
  readonly incomingRequests: readonly FriendRequestWithUser[]
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
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('friend_requests')
      .insert({ from_user_id: user.id, to_user_id: toUserId })

    if (error) throw error
    await get().fetchOutgoingRequests()
  },

  acceptRequest: async (requestId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: request, error: fetchError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !request) throw fetchError ?? new Error('Request not found')

    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)

    if (updateError) throw updateError

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
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)

    if (error) throw error
    await get().fetchFriends()
  },

  blockUser: async (userId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error: blockError } = await supabase
      .from('blocked_users')
      .insert({ blocker_id: user.id, blocked_id: userId })

    if (blockError) throw blockError

    await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`)

    await Promise.all([get().fetchFriends(), get().fetchBlockedUsers()])
  },

  unblockUser: async (userId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', userId)

    if (error) throw error
    await get().fetchBlockedUsers()
  },
}))
