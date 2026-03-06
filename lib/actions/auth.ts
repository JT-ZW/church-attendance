'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const INACTIVITY_TIMEOUT_SECONDS = 30 * 60 // 30 minutes

export async function login(email: string, password: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

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

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
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
