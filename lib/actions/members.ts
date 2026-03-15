'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { InsertMember, Member } from '@/lib/types/database.types'

export async function checkPhoneExists(phoneNumber: string) {
  const supabase = createAdminClient()
  
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
  const supabase = createAdminClient()

  // Check if phone already exists
  if (memberData.phone_number) {
    const existing = await checkPhoneExists(memberData.phone_number)
    if (existing) {
      return { error: 'This phone number is already registered' }
    }
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
    .select('id, full_name, phone_number, date_of_birth, gender, branch_id, branches(name)')
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

// --------------------------------------------------------
// Family registration
// --------------------------------------------------------

export type FamilyMemberInput = {
  full_name: string
  gender: 'Male' | 'Female'
  date_of_birth: string
  family_role: 'spouse' | 'child' | 'other'
  phone_number?: string | null
  email?: string | null
  baptism_year?: number | null
}

export async function registerFamilyGroup(
  head: Omit<InsertMember, 'id' | 'created_at'>,
  familyMembers: FamilyMemberInput[]
) {
  const supabase = createAdminClient()

  // Check if head's phone already exists
  const existingPhone = await checkPhoneExists(head.phone_number!)
  if (existingPhone) {
    return { error: 'This phone number is already registered' }
  }

  // Generate a shared family_id
  const family_id = randomUUID()

  // Register the family head
  const { data: headData, error: headError } = await supabase
    .from('members')
    .insert({
      ...head,
      family_id,
      family_role: 'head',
      registration_source: head.registration_source ?? 'self_registration',
      is_verified: head.is_verified ?? false,
    })
    .select()
    .single()

  if (headError) {
    return { error: headError.message }
  }

  // Register dependents if any
  if (familyMembers.length > 0) {
    // Check for duplicate phones among dependents that provided one
    const dependentPhones = familyMembers
      .map((fm) => fm.phone_number)
      .filter(Boolean) as string[]

    for (const phone of dependentPhones) {
      const exists = await checkPhoneExists(phone)
      if (exists) {
        // Roll back head registration and return error
        await supabase.from('members').delete().eq('id', headData.id)
        return { error: `Phone number ${phone} is already registered` }
      }
    }

    const { error: familyError } = await supabase.from('members').insert(
      familyMembers.map((fm) => ({
        full_name: fm.full_name,
        gender: fm.gender,
        date_of_birth: fm.date_of_birth,
        phone_number: fm.phone_number || null,
        email: fm.email || null,
        baptism_year: fm.baptism_year ?? null,
        home_address: head.home_address,
        branch_id: head.branch_id,
        family_id,
        family_role: fm.family_role,
        registered_by_member_id: headData.id,
        registration_source: 'self_registration' as const,
        is_verified: false,
      }))
    )

    if (familyError) {
      // Roll back head registration
      await supabase.from('members').delete().eq('id', headData.id)
      return { error: familyError.message }
    }
  }

  revalidatePath('/members')
  return { data: headData, error: null }
}

// --------------------------------------------------------
// Family check-in helpers
// --------------------------------------------------------

export async function getFamilyMembers(memberId: string, eventId: string) {
  const supabase = await createClient()

  // Get this member's family_id
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('family_id')
    .eq('id', memberId)
    .single()

  if (memberError || !member?.family_id) {
    return []
  }

  // Get all other members in the same family
  const { data: familyMembers, error: familyError } = await supabase
    .from('members')
    .select('id, full_name, gender, date_of_birth, family_role')
    .eq('family_id', member.family_id)
    .neq('id', memberId)

  if (familyError || !familyMembers || familyMembers.length === 0) {
    return []
  }

  // Check which family members have already checked in to this event
  const memberIds = familyMembers.map((m) => m.id)
  const { data: existingAttendance } = await supabase
    .from('attendance')
    .select('member_id')
    .eq('event_id', eventId)
    .in('member_id', memberIds)

  const checkedInSet = new Set((existingAttendance ?? []).map((a) => a.member_id))

  return familyMembers.map((m) => ({
    ...m,
    already_checked_in: checkedInSet.has(m.id),
  }))}