import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { UserProfile } from '../types'
import type { ProfileUpdateInput } from '../lib/validation'

type ProfileState = {
  readonly isUpdating: boolean
}

type ProfileActions = {
  readonly updateProfile: (data: ProfileUpdateInput & { avatar_url?: string }) => Promise<UserProfile>
  readonly updatePreferences: (data: { discovery_radius?: number; is_discoverable?: boolean }) => Promise<UserProfile>
  readonly completeOnboarding: () => Promise<UserProfile>
}

export const useProfileStore = create<ProfileState & ProfileActions>(() => ({
  isUpdating: false,

  updateProfile: async (data) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw error
    return updated
  },

  updatePreferences: async (data) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw error
    return updated
  },

  completeOnboarding: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw error
    return updated
  },
}))
