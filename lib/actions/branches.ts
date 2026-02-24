'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { InsertBranch, Branch } from '@/lib/types/database.types'

export async function getBranches() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
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
    throw new Error(error.message)
  }

  return data
}

export async function createBranch(branchData: Omit<InsertBranch, 'id' | 'created_at'>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('branches')
    .insert(branchData)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/branches')
  return { data, error: null }
}

export async function updateBranch(id: string, branchData: Partial<Branch>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('branches')
    .update(branchData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/branches')
  return { data, error: null }
}

export async function deleteBranch(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('branches')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
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
