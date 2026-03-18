'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { InsertAttendance } from '@/lib/types/database.types'

export async function checkIn(memberId: string, eventId: string) {
  const supabase = await createClient()

  // Check if event exists and is active
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, is_active, title, event_date')
    .eq('id', eventId)
    .single()

  if (eventError) {
    return { error: 'Event not found' }
  }

  if (!event.is_active) {
    return { error: 'This event is no longer active for check-ins' }
  }

  // Reject check-ins for events that ended more than 24 hours ago
  const eventDate = new Date((event as any).event_date ?? '')
  const hoursSince = (Date.now() - eventDate.getTime()) / (1000 * 60 * 60)
  if (!isNaN(hoursSince) && hoursSince > 24) {
    return { error: 'This event has expired and is no longer accepting check-ins' }
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
    console.error('[checkIn]', error)
    return { error: 'Failed to record check-in' }
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
    console.error('[getAttendanceByEvent]', error)
    throw new Error('Failed to load attendance')
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
    console.error('[hasCheckedIn]', error)
    throw new Error('Failed to check attendance status')
  }

  return !!data
}

// --------------------------------------------------------
// Family / group check-in
// --------------------------------------------------------
// Checks in multiple members at once.  Members who have already checked in
// are silently skipped — no error, no duplicate record.
export async function familyCheckIn(memberIds: string[], eventId: string) {
  const supabase = await createClient()

  if (memberIds.length === 0) {
    return { error: 'No members selected for check-in' }
  }

  // Verify the event is active
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, is_active')
    .eq('id', eventId)
    .single()

  if (eventError || !event) {
    return { error: 'Event not found' }
  }

  if (!event.is_active) {
    return { error: 'This event is no longer active for check-ins' }
  }

  // Find which members have already checked in
  const { data: existing } = await supabase
    .from('attendance')
    .select('member_id')
    .eq('event_id', eventId)
    .in('member_id', memberIds)

  const alreadyCheckedInSet = new Set((existing ?? []).map((a) => a.member_id))
  const toCheckIn = memberIds.filter((id) => !alreadyCheckedInSet.has(id))

  // All already checked in — nothing to do
  if (toCheckIn.length === 0) {
    return {
      data: {
        checked_in: [] as string[],
        already_checked_in: memberIds,
      },
      error: null,
    }
  }

  // Insert new attendance records
  const { error: insertError } = await supabase
    .from('attendance')
    .insert(toCheckIn.map((member_id) => ({ member_id, event_id: eventId })))

  if (insertError) {
    console.error('[familyCheckIn]', insertError)
    return { error: 'Failed to record check-in' }
  }

  revalidatePath(`/events/${eventId}`)
  return {
    data: {
      checked_in: toCheckIn,
      already_checked_in: Array.from(alreadyCheckedInSet),
    },
    error: null,
  }
}
