import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

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
  
  if (age <= 12) return '0-12'
  if (age <= 18) return '13-18'
  if (age <= 35) return '19-35'
  if (age <= 60) return '36-60'
  return '60+'
}

export function maskPhoneNumber(phone: string): string {
  if (phone.length < 4) return phone
  const lastFour = phone.slice(-4)
  const masked = phone.slice(0, -4).replace(/\d/g, '*')
  return masked + lastFour
}

export function generateQRToken(): string {
  // Generate a secure random token
  const randomPart = Math.random().toString(36).substring(2, 15)
  const timestampPart = Date.now().toString(36)
  return `${randomPart}${timestampPart}`
}
