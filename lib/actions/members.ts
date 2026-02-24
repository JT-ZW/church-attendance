'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { InsertMember, Member } from '@/lib/types/database.types'

export async function checkPhoneExists(phoneNumber: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('members')
    .select('id, full_name, phone_number')
    .eq('phone_number', phoneNumber)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "not found" error, which is expected when phone doesn't exist
    throw new Error(error.message)
  }

  return data
}

export async function registerMember(memberData: Omit<InsertMember, 'id' | 'created_at'>) {
  const supabase = await createClient()

  // Check if phone already exists
  const existing = await checkPhoneExists(memberData.phone_number)
  if (existing) {
    return { error: 'This phone number is already registered' }
  }

  const { data, error } = await supabase
    .from('members')
    .insert({
      ...memberData,
      registration_source: 'self_registration',
      is_verified: false,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/members')
  return { data, error: null }
}

export async function getMembers(branchId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('members')
    .select(`
      *,
      branches (
        id,
        name,
        location
      )
    `)
    .order('created_at', { ascending: false })

  if (branchId) {
    query = query.eq('branch_id', branchId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getMemberById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('members')
    .select(`
      *,
      branches (
        id,
        name,
        location
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function updateMember(id: string, memberData: Partial<Member>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('members')
    .update(memberData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/members')
  return { data, error: null }
}

export async function deleteMember(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/members')
  return { error: null }
}

export async function searchMembers(searchTerm: string, branchId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('members')
    .select('id, full_name, phone_number, date_of_birth, gender, branch_id')
    .ilike('full_name', `%${searchTerm}%`)
    .limit(10)

  if (branchId) {
    query = query.eq('branch_id', branchId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return data
}
