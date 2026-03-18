'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const INACTIVITY_TIMEOUT_SECONDS = 30 * 60 // 30 minutes
const MAX_FAILED_ATTEMPTS = 10
const RATE_LIMIT_WINDOW_MINUTES = 15

export async function login(email: string, password: string): Promise<{ error: string | null }> {
  const adminSupabase = createAdminClient()
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString()

  // Check failed attempts by email in the rate-limit window (server-side)
  const { count: emailFailures } = await adminSupabase
    .from('login_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .eq('success', false)
    .gte('attempted_at', windowStart)

  // Check failed attempts by IP in the rate-limit window
  const { count: ipFailures } = await adminSupabase
    .from('login_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .eq('success', false)
    .gte('attempted_at', windowStart)

  if ((emailFailures ?? 0) >= MAX_FAILED_ATTEMPTS || (ipFailures ?? 0) >= MAX_FAILED_ATTEMPTS) {
    return { error: `Too many failed login attempts. Please wait ${RATE_LIMIT_WINDOW_MINUTES} minutes before trying again.` }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  // Record the attempt — non-blocking, failure here is not critical
  void adminSupabase
    .from('login_attempts')
    .insert({ email, ip_address: ip, success: !error })

  if (error) {
    return { error: error.message }
  }

  // Set the activity cookie so the 30-min inactivity timer starts from login
  const cookieStore = await cookies()
  cookieStore.set('last_activity', String(Date.now()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: INACTIVITY_TIMEOUT_SECONDS,
    path: '/',
  })

  return { error: null }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // Clear activity cookie
  const cookieStore = await cookies()
  cookieStore.delete('last_activity')
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

// Used by the /reset-password page after the user clicks the recovery link in their email
export async function changePassword(newPassword: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) return { error: error.message }

  return { error: null }
}
