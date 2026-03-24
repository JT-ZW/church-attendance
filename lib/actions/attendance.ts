'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { InsertAttendance } from '@/lib/types/database.types'
import { getCurrentAdminProfile } from '@/lib/actions/users'
import { guestAttendanceSchema } from '@/lib/validations/schemas'

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

type GuestInput = {
  full_name: string
  gender: 'Male' | 'Female'
  phone_number?: string | null
}

function isGuestSchemaMissingError(error: any) {
  return error?.code === '42P01' || error?.code === 'PGRST205'
}

async function ensureAdminCanManageEvent(eventId: string) {
  const profile = await getCurrentAdminProfile()
  if (!profile) {
    return { error: 'Unauthorized', event: null }
  }

  const supabase = await createClient()
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, branch_id')
    .eq('id', eventId)
    .single()

  if (eventError || !event) {
    return { error: 'Event not found', event: null }
  }

  if (profile.role === 'branch_admin' && profile.branch_id && event.branch_id !== profile.branch_id) {
    return { error: 'Unauthorized: you can only manage attendance for your branch events', event: null }
  }

  return { error: null, event }
}

export async function getGuestAttendanceByEvent(eventId: string) {
  const auth = await ensureAdminCanManageEvent(eventId)
  if (auth.error) {
    throw new Error(auth.error)
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('guest_attendance')
    .select(`
      *,
      guests (
        id,
        full_name,
        gender,
        phone_number,
        created_at
      )
    `)
    .eq('event_id', eventId)
    .order('checked_in_at', { ascending: false })

  if (error) {
    if (isGuestSchemaMissingError(error)) {
      return []
    }

    console.error('[getGuestAttendanceByEvent]', error)
    throw new Error('Failed to load guest attendance')
  }

  return data
}

export async function addGuestAttendance(eventId: string, input: GuestInput) {
  const auth = await ensureAdminCanManageEvent(eventId)
  if (auth.error) {
    return { error: auth.error }
  }

  const parsed = guestAttendanceSchema.safeParse({
    full_name: input.full_name,
    gender: input.gender,
    phone_number: input.phone_number ?? '',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid guest details' }
  }

  const fullName = parsed.data.full_name.trim().replace(/\s+/g, ' ')
  const phoneNumber = parsed.data.phone_number?.trim() || null

  if (!fullName) {
    return { error: 'Guest full name is required' }
  }

  const supabase = await createClient()

  let guestId: string | null = null

  if (phoneNumber) {
    const { data: existingByPhone, error: phoneLookupError } = await supabase
      .from('guests')
      .select('id, gender')
      .eq('phone_number', phoneNumber)
      .maybeSingle()

    if (phoneLookupError) {
      if (isGuestSchemaMissingError(phoneLookupError)) {
        return { error: 'Guest attendance tables are not installed. Run supabase-guest-attendance.sql first.' }
      }

      console.error('[addGuestAttendance][lookup by phone]', phoneLookupError)
      return { error: 'Failed to validate guest profile' }
    }

    if (existingByPhone?.id) {
      if (existingByPhone.gender !== parsed.data.gender) {
        return { error: 'A guest with this phone number already exists with a different gender' }
      }
      guestId = existingByPhone.id
    }
  }

  if (!guestId) {
    const { data: existingByName, error: nameLookupError } = await supabase
      .from('guests')
      .select('id, phone_number')
      .ilike('full_name', fullName)
      .eq('gender', parsed.data.gender)
      .limit(1)
      .maybeSingle()

    if (nameLookupError) {
      if (isGuestSchemaMissingError(nameLookupError)) {
        return { error: 'Guest attendance tables are not installed. Run supabase-guest-attendance.sql first.' }
      }

      console.error('[addGuestAttendance][lookup by name]', nameLookupError)
      return { error: 'Failed to validate guest profile' }
    }

    if (existingByName?.id) {
      guestId = existingByName.id

      if (phoneNumber && !existingByName.phone_number) {
        const { error: enrichGuestError } = await supabase
          .from('guests')
          .update({ phone_number: phoneNumber })
          .eq('id', existingByName.id)

        if (enrichGuestError) {
          console.error('[addGuestAttendance][enrich guest phone]', enrichGuestError)
        }
      }
    }
  }

  if (!guestId) {
    const { data: guest, error: guestInsertError } = await supabase
      .from('guests')
      .insert({
        full_name: fullName,
        gender: parsed.data.gender,
        phone_number: phoneNumber,
      })
      .select('id')
      .single()

    if (guestInsertError || !guest) {
      if (isGuestSchemaMissingError(guestInsertError)) {
        return { error: 'Guest attendance tables are not installed. Run supabase-guest-attendance.sql first.' }
      }

      console.error('[addGuestAttendance][insert guest]', guestInsertError)
      return { error: 'Failed to create guest profile' }
    }

    guestId = guest.id
  }

  const { data: attendance, error: attendanceError } = await supabase
    .from('guest_attendance')
    .insert({
      guest_id: guestId,
      event_id: eventId,
    })
    .select('*')
    .single()

  if (attendanceError) {
    if (isGuestSchemaMissingError(attendanceError)) {
      return { error: 'Guest attendance tables are not installed. Run supabase-guest-attendance.sql first.' }
    }

    if (attendanceError.code === '23505') {
      return { error: 'This guest has already been added to this event' }
    }

    console.error('[addGuestAttendance][insert attendance]', attendanceError)
    return { error: 'Failed to add guest attendance' }
  }

  revalidatePath(`/events/${eventId}`)

  return {
    data: attendance,
    error: null,
  }
}

export async function updateGuestProfile(
  eventId: string,
  guestId: string,
  input: GuestInput
) {
  const auth = await ensureAdminCanManageEvent(eventId)
  if (auth.error) {
    return { error: auth.error }
  }

  const parsed = guestAttendanceSchema.safeParse({
    full_name: input.full_name,
    gender: input.gender,
    phone_number: input.phone_number ?? '',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid guest details' }
  }

  const fullName = parsed.data.full_name.trim().replace(/\s+/g, ' ')
  const phoneNumber = parsed.data.phone_number?.trim() || null

  const supabase = await createClient()

  const { error } = await supabase
    .from('guests')
    .update({
      full_name: fullName,
      gender: parsed.data.gender,
      phone_number: phoneNumber,
    })
    .eq('id', guestId)

  if (error) {
    if (isGuestSchemaMissingError(error)) {
      return { error: 'Guest attendance tables are not installed. Run supabase-guest-attendance.sql first.' }
    }

    if (error.code === '23505') {
      return { error: 'Another guest already has this phone number' }
    }

    console.error('[updateGuestProfile]', error)
    return { error: 'Failed to update guest profile' }
  }

  revalidatePath(`/events/${eventId}`)
  return { error: null }
}

export async function deleteMemberAttendanceRecord(eventId: string, attendanceId: string) {
  const auth = await ensureAdminCanManageEvent(eventId)
  if (auth.error) {
    return { error: auth.error }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('attendance')
    .delete()
    .eq('id', attendanceId)
    .eq('event_id', eventId)

  if (error) {
    console.error('[deleteMemberAttendanceRecord]', error)
    return { error: 'Failed to delete attendance record' }
  }

  revalidatePath(`/events/${eventId}`)
  return { error: null }
}

export async function deleteGuestAttendanceRecord(eventId: string, guestAttendanceId: string) {
  const auth = await ensureAdminCanManageEvent(eventId)
  if (auth.error) {
    return { error: auth.error }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('guest_attendance')
    .delete()
    .eq('id', guestAttendanceId)
    .eq('event_id', eventId)

  if (error) {
    if (isGuestSchemaMissingError(error)) {
      return { error: 'Guest attendance tables are not installed. Run supabase-guest-attendance.sql first.' }
    }

    console.error('[deleteGuestAttendanceRecord]', error)
    return { error: 'Failed to delete guest attendance record' }
  }

  revalidatePath(`/events/${eventId}`)
  return { error: null }
}
