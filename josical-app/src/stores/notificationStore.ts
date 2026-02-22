import { create } from 'zustand'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import { supabase } from '../lib/supabase'
import type { Notification } from '../types'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

type NotificationState = {
  readonly notifications: readonly Notification[]
  readonly unreadCount: number
  readonly isLoading: boolean
  readonly expoPushToken: string | null
}

type NotificationActions = {
  readonly fetchNotifications: () => Promise<void>
  readonly markAsRead: (notificationId: string) => Promise<void>
  readonly markAllAsRead: () => Promise<void>
  readonly registerPushToken: () => Promise<void>
  readonly fetchUnreadCount: () => Promise<void>
}

export const useNotificationStore = create<NotificationState & NotificationActions>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  expoPushToken: null,

  fetchNotifications: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      set({ notifications: data ?? [] })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchUnreadCount: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) throw error
    set({ unreadCount: count ?? 0 })
  },

  markAsRead: async (notificationId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) throw error

    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }))
  },

  markAllAsRead: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) throw error

    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }))
  },

  registerPushToken: async () => {
    if (Platform.OS === 'web') return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') return

    const tokenData = await Notifications.getExpoPushTokenAsync()
    const token = tokenData.data

    set({ expoPushToken: token })

    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        { user_id: user.id, token },
        { onConflict: 'user_id,token' }
      )

    if (error) throw error
  },
}))
