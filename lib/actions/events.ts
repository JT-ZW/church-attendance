'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { InsertEvent, Event } from '@/lib/types/database.types'
import { generateQRToken } from '@/lib/utils/helpers'
import { getCurrentAdminProfile } from '@/lib/actions/users'

export async function getEvents(branchId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('events')
    .select(`
      *,
      branches (
        id,
        name,
        location
      )
    `)
    .is('deleted_at', null)
    .order('event_date', { ascending: false })

  if (branchId) {
    query = query.eq('branch_id', branchId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[getEvents]', error)
    throw new Error('Failed to load events')
  }

  return data
}

export async function getEventById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
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
    console.error('[getEventById]', error)
    throw new Error('Failed to load event')
  }

  return data
}

export async function getEventByToken(token: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      branches (
        id,
        name,
        location
      )
    `)
    .eq('qr_token', token)
    .single()

  if (error) {
    throw new Error('Event not found')
  }

  return data
}

export async function createEvent(
  eventData: Omit<InsertEvent, 'id' | 'created_at' | 'qr_token' | 'created_by'>
) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Generate unique QR token
  const qrToken = generateQRToken()

  const { data, error } = await supabase
    .from('events')
    .insert({
      ...eventData,
      qr_token: qrToken,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/events')
  return { data, error: null }
}

export async function updateEvent(id: string, eventData: Partial<Event>) {
  const profile = await getCurrentAdminProfile()
  if (!profile) return { error: 'Unauthorized' }

  const supabase = await createClient()

  // Branch admins can only update events in their own branch
  if (profile.role === 'branch_admin' && profile.branch_id) {
    const { data: existing } = await supabase
      .from('events').select('branch_id').eq('id', id).single()
    if (!existing || existing.branch_id !== profile.branch_id) {
      return { error: 'Unauthorized: you can only modify events in your branch' }
    }
  }

  const { data, error } = await supabase
    .from('events')
    .update(eventData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[updateEvent]', error)
    return { error: 'Failed to update event' }
  }

  revalidatePath('/events')
  return { data, error: null }
}

export async function toggleEventStatus(id: string, isActive: boolean) {
  return updateEvent(id, { is_active: isActive })
}

export async function deleteEvent(id: string) {
  const profile = await getCurrentAdminProfile()
  if (!profile) return { error: 'Unauthorized' }

  const supabase = await createClient()

  // Branch admins can only delete events in their own branch
  if (profile.role === 'branch_admin' && profile.branch_id) {
    const { data: existing } = await supabase
      .from('events').select('branch_id').eq('id', id).single()
    if (!existing || existing.branch_id !== profile.branch_id) {
      return { error: 'Unauthorized: you can only delete events in your branch' }
    }
  }

  // Soft delete: set deleted_at/deleted_by instead of hard DELETE
  const { error } = await supabase
    .from('events')
    .update({ deleted_at: new Date().toISOString(), deleted_by: profile.user_id })
    .eq('id', id)

  if (error) {
    console.error('[deleteEvent]', error)
    return { error: 'Failed to delete event' }
  }

  revalidatePath('/events')
  return { error: null }
}

export async function getEventAttendance(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      members (
        id,
        full_name,
        gender,
        date_of_birth,
        phone_number
      )
    `)
    .eq('event_id', eventId)
    .order('checked_in_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getEventStats(eventId: string) {
  const supabase = await createClient()

  // Get event with branch info
  const event = await getEventById(eventId)

  // Get attendance count
  const { count: attendanceCount } = await supabase
    .from('attendance')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)

  // Get gender breakdown
  const { data: attendees } = await supabase
    .from('attendance')
    .select(`
      members (
        gender
      )
    `)
    .eq('event_id', eventId)

  const maleCount = attendees?.filter((a: any) => a.members?.gender === 'Male').length || 0
  const femaleCount = attendees?.filter((a: any) => a.members?.gender === 'Female').length || 0

  // Get total members in branch for percentage
  const { count: totalMembers } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('branch_id', event.branch_id)

  const attendancePercentage = totalMembers
    ? Math.round(((attendanceCount || 0) / totalMembers) * 100)
    : 0

  return {
    totalAttendees: attendanceCount || 0,
    maleCount,
    femaleCount,
    totalMembers: totalMembers || 0,
    attendancePercentage,
  }
}
