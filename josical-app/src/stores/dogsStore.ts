import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Dog } from '../types'
import type { DogInput } from '../lib/validation'

type DogsState = {
  readonly myDogs: readonly Dog[]
  readonly isLoading: boolean
}

type DogsActions = {
  readonly fetchMyDogs: () => Promise<void>
  readonly fetchUserDogs: (userId: string) => Promise<readonly Dog[]>
  readonly addDog: (data: DogInput & { photo_url?: string }) => Promise<Dog>
  readonly updateDog: (id: string, data: Partial<DogInput> & { photo_url?: string }) => Promise<Dog>
  readonly deleteDog: (id: string) => Promise<void>
}

export const useDogsStore = create<DogsState & DogsActions>((set) => ({
  myDogs: [],
  isLoading: false,

  fetchMyDogs: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })
      if (error) throw error
      set({ myDogs: data ?? [] })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchUserDogs: async (userId) => {
    const { data, error } = await supabase
      .from('dogs')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  addDog: async (data) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data: dog, error } = await supabase
      .from('dogs')
      .insert({ ...data, owner_id: user.id })
      .select()
      .single()
    if (error) throw error
    set((state) => ({ myDogs: [...state.myDogs, dog] }))
    return dog
  },

  updateDog: async (id, data) => {
    const { data: dog, error } = await supabase
      .from('dogs')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    set((state) => ({
      myDogs: state.myDogs.map((d) => (d.id === id ? dog : d)),
    }))
    return dog
  },

  deleteDog: async (id) => {
    const { error } = await supabase.from('dogs').delete().eq('id', id)
    if (error) throw error
    set((state) => ({ myDogs: state.myDogs.filter((d) => d.id !== id) }))
  },
}))
