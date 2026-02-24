'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { InsertAttendance } from '@/lib/types/database.types'

export async function checkIn(memberId: string, eventId: string) {
  const supabase = await createClient()

  // Check if event exists and is active
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, is_active, title')
    .eq('id', eventId)
    .single()

  if (eventError) {
    return { error: 'Event not found' }
  }

  if (!event.is_active) {
    return { error: 'This event is no longer active for check-ins' }
  }

  // Check if already checked in
  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('member_id', memberId)
    .eq('event_id', eventId)
    .single()

  if (existing) {
    return { error: 'You have already checked in to this event' }
  }

  // Insert attendance record
  const { data, error } = await supabase
    .from('attendance')
    .insert({
      member_id: memberId,
      event_id: eventId,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/events/${eventId}`)
  return { data, error: null }
}

export async function getAttendanceByEvent(eventId: string) {
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
        phone_number,
        branches (
          id,
          name,
          location
        )
      )
    `)
    .eq('event_id', eventId)
    .order('checked_in_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function hasCheckedIn(memberId: string, eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('attendance')
    .select('id')
    .eq('member_id', memberId)
    .eq('event_id', eventId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message)
  }

  return !!data
}
