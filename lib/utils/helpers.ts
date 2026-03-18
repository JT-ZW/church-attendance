import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { nanoid } from 'nanoid'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function calculateAge(dateOfBirth: string | Date): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

export function getAgeGroup(dateOfBirth: string | Date): string {
  const age = calculateAge(dateOfBirth)
  if (age < 12) return 'Children (Sunday School)'
  if (age < 40) return 'Youth'
  return 'Adults'
}

export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return 'N/A'
  if (phone.length < 4) return phone
  const lastFour = phone.slice(-4)
  const masked = phone.slice(0, -4).replace(/\d/g, '*')
  return masked + lastFour
}

export function generateQRToken(): string {
  // nanoid provides cryptographically secure random tokens (replaces Math.random)
  return nanoid(32)
}
