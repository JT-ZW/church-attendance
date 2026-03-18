'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { InsertBranch, Branch } from '@/lib/types/database.types'
import { getCurrentAdminProfile } from '@/lib/actions/users'

export async function getBranches() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (error) {
    console.error('[getBranches]', error)
    throw new Error('Failed to load branches')
  }

  return data
}

export async function getBranchById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[getBranchById]', error)
    throw new Error('Failed to load branch')
  }

  return data
}

export async function createBranch(branchData: Omit<InsertBranch, 'id' | 'created_at'>) {
  const profile = await getCurrentAdminProfile()
  if (profile?.role !== 'super_admin') return { error: 'Unauthorized: only super admins can create branches' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('branches')
    .insert(branchData)
    .select()
    .single()

  if (error) {
    console.error('[createBranch]', error)
    return { error: 'Failed to create branch' }
  }

  revalidatePath('/branches')
  return { data, error: null }
}

export async function updateBranch(id: string, branchData: Partial<Branch>) {
  const profile = await getCurrentAdminProfile()
  if (!profile) return { error: 'Unauthorized' }

  // Branch admins can only update their own branch
  if (profile.role === 'branch_admin' && profile.branch_id !== id) {
    return { error: 'Unauthorized: you can only modify your own branch' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('branches')
    .update(branchData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[updateBranch]', error)
    return { error: 'Failed to update branch' }
  }

  revalidatePath('/branches')
  return { data, error: null }
}

export async function deleteBranch(id: string) {
  const profile = await getCurrentAdminProfile()
  if (profile?.role !== 'super_admin') return { error: 'Unauthorized: only super admins can delete branches' }

  const supabase = await createClient()

  // Soft delete: set deleted_at/deleted_by instead of hard DELETE
  const { error } = await supabase
    .from('branches')
    .update({ deleted_at: new Date().toISOString(), deleted_by: profile.user_id })
    .eq('id', id)

  if (error) {
    console.error('[deleteBranch]', error)
    return { error: 'Failed to delete branch' }
  }

  revalidatePath('/branches')
  return { error: null }
}

export async function getBranchStats(branchId: string) {
  const supabase = await createClient()

  // Get total members
  const { count: memberCount } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('branch_id', branchId)

  // Get total events
  const { count: eventCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('branch_id', branchId)

  // Get total attendance
  const { count: attendanceCount } = await supabase
    .from('attendance')
    .select(`
      *,
      events!inner (
        branch_id
      )
    `, { count: 'exact', head: true })
    .eq('events.branch_id', branchId)

  return {
    memberCount: memberCount || 0,
    eventCount: eventCount || 0,
    totalAttendance: attendanceCount || 0,
  }
}
