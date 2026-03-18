import { z } from 'zod'

// Branch validation schema
export const branchSchema = z.object({
  name: z.string().min(2, 'Branch name must be at least 2 characters').max(100, 'Branch name too long'),
  location: z.string().min(5, 'Location must be at least 5 characters').max(500, 'Location too long'),
})

export type BranchFormData = z.infer<typeof branchSchema>

// Member validation schema
export const memberSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name too long'),
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
    .max(20, 'Phone number too long')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format'),
  baptism_year: z
    .number()
    .min(1900, 'Invalid baptism year')
    .max(new Date().getFullYear(), 'Baptism year cannot be in the future')
    .optional()
    .nullable(),
  home_address: z.string().min(5, 'Home address must be at least 5 characters').max(500, 'Address too long'),
  branch_id: z.string().uuid('Invalid branch selection'),
  email: z.string().email('Invalid email address').max(255, 'Email too long').optional().nullable().or(z.literal('')),
})

export type MemberFormData = z.infer<typeof memberSchema>

// Self registration schema (simplified)
export const selfRegistrationSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name too long'),
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
    .max(20, 'Phone number too long')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format'),
  home_address: z.string().min(5, 'Home address must be at least 5 characters').max(500, 'Address too long'),
  branch_id: z.string().uuid('Invalid branch selection'),
  email: z.string().email('Invalid email address').max(255, 'Email too long').optional().or(z.literal('')),
})

export type SelfRegistrationFormData = z.infer<typeof selfRegistrationSchema>

// Schema for a single dependent/family member being registered alongside the head
export const familyMemberSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  gender: z.enum(['Male', 'Female'], {
    message: 'Please select a gender',
  }),
  date_of_birth: z.string().refine((date) => {
    const d = new Date(date)
    const now = new Date()
    return d < now
  }, 'Date of birth must be in the past'),
  family_role: z.enum(['spouse', 'child', 'other'], {
    message: 'Please select a relationship',
  }),
  // Phone is optional for dependents (children especially)
  phone_number: z
    .string()
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  baptism_year: z
    .number()
    .min(1900, 'Invalid baptism year')
    .max(new Date().getFullYear(), 'Baptism year cannot be in the future')
    .optional()
    .nullable(),
})

export type FamilyMemberFormData = z.infer<typeof familyMemberSchema>

// Full family group registration schema
export const familyRegistrationSchema = z.object({
  head: selfRegistrationSchema,
  family_members: z.array(familyMemberSchema),
})

export type FamilyRegistrationFormData = z.infer<typeof familyRegistrationSchema>

// Event validation schema
export const eventSchema = z.object({
  title: z.string().min(3, 'Event title must be at least 3 characters').max(200, 'Event title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
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
  password: z.string().min(1, 'Password is required'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// Strong password schema (used for creating/resetting passwords)
export const newPasswordSchema = z.string()
  .min(10, 'Password must be at least 10 characters')
  .max(128, 'Password too long')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character')

export type NewPasswordData = z.infer<typeof newPasswordSchema>

// Check-in search schema
export const checkInSearchSchema = z.object({
  searchTerm: z.string().min(2, 'Please enter at least 2 characters'),
})

export type CheckInSearchData = z.infer<typeof checkInSearchSchema>
