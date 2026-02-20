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
  readonly loginWithGoogle: (idToken: string) => Promise<void>
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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
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

  loginWithGoogle: async (idToken) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
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

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  },
}))
