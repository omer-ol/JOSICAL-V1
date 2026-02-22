import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { UserProfile } from '../types'
import type { Session } from '@supabase/supabase-js'

const MAX_AUTH_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 60_000

type AuthState = {
  readonly session: Session | null
  readonly profile: UserProfile | null
  readonly isLoading: boolean
  readonly isInitialized: boolean
  readonly loginAttempts: number
  readonly lockoutUntil: number | null
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

const checkRateLimit = (attempts: number, lockoutUntil: number | null): void => {
  if (lockoutUntil && Date.now() < lockoutUntil) {
    const secondsLeft = Math.ceil((lockoutUntil - Date.now()) / 1000)
    throw new Error(`Too many attempts. Please wait ${secondsLeft} seconds.`)
  }
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  session: null,
  profile: null,
  isLoading: false,
  isInitialized: false,
  loginAttempts: 0,
  lockoutUntil: null,

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
      if (!data.session) {
        throw new Error('CONFIRMATION_REQUIRED')
      }
      set({ session: data.session })
      await get().fetchProfile()
    } finally {
      set({ isLoading: false })
    }
  },

  login: async (email, password) => {
    const { loginAttempts, lockoutUntil } = get()
    checkRateLimit(loginAttempts, lockoutUntil)

    set({ isLoading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        const newAttempts = loginAttempts + 1
        const newLockout = newAttempts >= MAX_AUTH_ATTEMPTS
          ? Date.now() + LOCKOUT_DURATION_MS
          : null
        set({ loginAttempts: newAttempts, lockoutUntil: newLockout })
        throw error
      }
      set({ session: data.session, loginAttempts: 0, lockoutUntil: null })
      await get().fetchProfile()
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    set({ session: null, profile: null, loginAttempts: 0, lockoutUntil: null })
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
    const { loginAttempts, lockoutUntil } = get()
    checkRateLimit(loginAttempts, lockoutUntil)

    set({ isLoading: true })
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      })
      if (error) {
        const newAttempts = loginAttempts + 1
        const newLockout = newAttempts >= MAX_AUTH_ATTEMPTS
          ? Date.now() + LOCKOUT_DURATION_MS
          : null
        set({ loginAttempts: newAttempts, lockoutUntil: newLockout })
        throw error
      }
      set({ session: data.session, loginAttempts: 0, lockoutUntil: null })
      if (data.session) {
        await get().fetchProfile()
      }
    } finally {
      set({ isLoading: false })
    }
  },

  resetPassword: async (email) => {
    const { loginAttempts, lockoutUntil } = get()
    checkRateLimit(loginAttempts, lockoutUntil)

    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) {
      const newAttempts = loginAttempts + 1
      const newLockout = newAttempts >= MAX_AUTH_ATTEMPTS
        ? Date.now() + LOCKOUT_DURATION_MS
        : null
      set({ loginAttempts: newAttempts, lockoutUntil: newLockout })
      throw error
    }
  },
}))
