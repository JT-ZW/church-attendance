import { z } from 'zod'

// Branch validation schema
export const branchSchema = z.object({
  name: z.string().min(2, 'Branch name must be at least 2 characters'),
  location: z.string().min(5, 'Location must be at least 5 characters'),
})

export type BranchFormData = z.infer<typeof branchSchema>

// Member validation schema
export const memberSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  gender: z.enum(['Male', 'Female']).refine((val) => !!val, {
    message: 'Please select a gender',
  }),
  date_of_birth: z.string().refine((date) => {
    const d = new Date(date)
    const now = new Date()
    return d < now
  }, 'Date of birth must be in the past'),
  phone_number: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format'),
  baptism_year: z
    .number()
    .min(1900, 'Invalid baptism year')
    .max(new Date().getFullYear(), 'Baptism year cannot be in the future')
    .optional()
    .nullable(),
  home_address: z.string().min(5, 'Home address must be at least 5 characters'),
  branch_id: z.string().uuid('Invalid branch selection'),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
})

export type MemberFormData = z.infer<typeof memberSchema>

// Self registration schema (simplified)
export const selfRegistrationSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  gender: z.enum(['Male', 'Female'], {
    message: 'Please select a gender',
  }),
  date_of_birth: z.string().refine((date) => {
    const d = new Date(date)
    const now = new Date()
    return d < now
  }, 'Date of birth must be in the past'),
  phone_number: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format'),
  home_address: z.string().min(5, 'Home address must be at least 5 characters'),
  branch_id: z.string().uuid('Invalid branch selection'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
})

export type SelfRegistrationFormData = z.infer<typeof selfRegistrationSchema>

// Event validation schema
export const eventSchema = z.object({
  title: z.string().min(3, 'Event title must be at least 3 characters'),
  description: z.string().optional(),
  branch_id: z.string().uuid('Invalid branch selection'),
  event_date: z.string().refine((date) => {
    const d = new Date(date)
    return !isNaN(d.getTime())
  }, 'Invalid event date'),
})

export type EventFormData = z.infer<typeof eventSchema>

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// Check-in search schema
export const checkInSearchSchema = z.object({
  searchTerm: z.string().min(2, 'Please enter at least 2 characters'),
})

export type CheckInSearchData = z.infer<typeof checkInSearchSchema>
