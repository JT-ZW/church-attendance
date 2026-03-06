'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AdminProfile, AdminRole, AdminUser } from '@/lib/types/database.types'

// -------------------------------------------------------
// Read current user's admin profile
// -------------------------------------------------------
export async function getCurrentAdminProfile(): Promise<AdminProfile | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('admin_profiles')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('Failed to fetch admin profile:', error.message)
    return null
  }

  return data
}

// -------------------------------------------------------
// List all admin users (super admin only)
// -------------------------------------------------------
export async function listAdminUsers(): Promise<AdminUser[]> {
  const supabase = createAdminClient()

  // Fetch all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('admin_profiles')
    .select(`
      *,
      branches (
        name
      )
    `)
    .order('created_at', { ascending: false })

  if (profilesError) throw new Error(profilesError.message)

  // Fetch auth users to get emails
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) throw new Error(authError.message)

  const userEmailMap = new Map(authData.users.map((u) => [u.id, u.email ?? '']))

  return (profiles ?? []).map((p: any) => ({
    ...p,
    email: userEmailMap.get(p.user_id) ?? '',
    branch_name: p.branches?.name ?? null,
  }))
}

// -------------------------------------------------------
// Create a new admin user with a temporary password
// -------------------------------------------------------
export async function createAdminUserWithPassword(
  email: string,
  password: string,
  role: AdminRole,
  branchId: string | null
): Promise<{ error: string | null }> {
  const supabase = createAdminClient()

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email confirmation
  })

  if (authError) return { error: authError.message }

  const newUserId = authData.user.id

  // Insert admin_profile
  const { error: profileError } = await supabase.from('admin_profiles').insert({
    user_id: newUserId,
    role,
    branch_id: branchId,
    is_active: true,
  })

  if (profileError) {
    // Roll back auth user
    await supabase.auth.admin.deleteUser(newUserId)
    return { error: profileError.message }
  }

  revalidatePath('/users')
  return { error: null }
}

// -------------------------------------------------------
// Invite admin user via email (Supabase sends the invite)
// -------------------------------------------------------
export async function inviteAdminUser(
  email: string,
  role: AdminRole,
  branchId: string | null
): Promise<{ error: string | null }> {
  const supabase = createAdminClient()

  const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email)

  if (authError) return { error: authError.message }

  const newUserId = authData.user.id

  const { error: profileError } = await supabase.from('admin_profiles').insert({
    user_id: newUserId,
    role,
    branch_id: branchId,
    is_active: true,
  })

  if (profileError) {
    await supabase.auth.admin.deleteUser(newUserId)
    return { error: profileError.message }
  }

  revalidatePath('/users')
  return { error: null }
}

// -------------------------------------------------------
// Send password reset email to an existing admin user
// -------------------------------------------------------
export async function sendPasswordReset(email: string): Promise<{ error: string | null }> {
  // Use the regular (anon) client — resetPasswordForEmail triggers the
  // Supabase email provider to actually SEND the recovery email.
  // The admin generateLink API only returns the link without emailing it.
  const supabase = await createClient()

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // Supabase will append ?code=XXX to this URL.
    // The /auth/callback route exchanges the code for a session, then
    // redirects the user to /reset-password?mode=set where they set their new password.
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password?mode=set`,
  })

  if (error) return { error: error.message }

  return { error: null }
}

// -------------------------------------------------------
// Update an existing admin profile
// -------------------------------------------------------
export async function updateAdminUser(
  profileId: string,
  updates: { role?: AdminRole; branchId?: string | null; isActive?: boolean }
): Promise<{ error: string | null }> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('admin_profiles')
    .update({
      ...(updates.role !== undefined && { role: updates.role }),
      ...(updates.branchId !== undefined && { branch_id: updates.branchId }),
      ...(updates.isActive !== undefined && { is_active: updates.isActive }),
    })
    .eq('id', profileId)

  if (error) return { error: error.message }

  revalidatePath('/users')
  return { error: null }
}

// -------------------------------------------------------
// Delete an admin user entirely (removes auth + profile)
// -------------------------------------------------------
export async function deleteAdminUser(userId: string): Promise<{ error: string | null }> {
  const supabase = createAdminClient()

  // Deleting auth user cascades to admin_profiles (ON DELETE CASCADE)
  const { error } = await supabase.auth.admin.deleteUser(userId)

  if (error) return { error: error.message }

  revalidatePath('/users')
  return { error: null }
}
