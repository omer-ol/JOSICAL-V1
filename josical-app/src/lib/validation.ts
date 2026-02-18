import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Please enter a valid email').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
})

export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim().optional(),
  bio: z.string().max(200, 'Bio must be 200 characters or less').trim().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
})

export const dogSchema = z.object({
  name: z.string().min(1, 'Dog name is required').trim(),
  breed: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  age_category: z.enum(['puppy', 'adult', 'senior']).optional(),
  is_neutered: z.boolean().optional(),
})

export const preferencesSchema = z.object({
  discovery_radius: z.number().min(0.5).max(10),
  is_discoverable: z.boolean(),
})

export const messageSchema = z.object({
  type: z.enum(['text', 'image', 'location']),
  content: z.string().min(1).max(2000),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type DogInput = z.infer<typeof dogSchema>
export type PreferencesInput = z.infer<typeof preferencesSchema>
export type MessageInput = z.infer<typeof messageSchema>
