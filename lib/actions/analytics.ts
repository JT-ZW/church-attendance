'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function getAnalyticsSummary(branchId?: string) {
  const supabase = createAdminClient()

  // Get total members
  let memberQuery = supabase
    .from('members')
    .select('*', { count: 'exact' })

  if (branchId) {
    memberQuery = memberQuery.eq('branch_id', branchId)
  }

  const { data: members, count: memberCount } = await memberQuery

  // Get total events
  let eventQuery = supabase
    .from('events')
    .select('*', { count: 'exact' })

  if (branchId) {
    eventQuery = eventQuery.eq('branch_id', branchId)
  }

  const { count: eventCount } = await eventQuery

  // Get total attendance
  let attendanceQuery = supabase
    .from('attendance')
    .select(`
      *,
      events!inner (
        branch_id
      )
    `, { count: 'exact' })

  if (branchId) {
    attendanceQuery = attendanceQuery.eq('events.branch_id', branchId)
  }

  const { count: attendanceCount } = await attendanceQuery

  // Calculate average attendance per event
  const avgAttendance = eventCount && eventCount > 0 
    ? Math.round((attendanceCount || 0) / eventCount) 
    : 0

  // Get gender breakdown
  const maleCount = members?.filter(m => m.gender === 'Male').length || 0
  const femaleCount = members?.filter(m => m.gender === 'Female').length || 0

  // Get registration source breakdown
  const adminRegistered = members?.filter(m => m.registration_source === 'admin').length || 0
  const selfRegistered = members?.filter(m => m.registration_source === 'self_registration').length || 0

  return {
    totalMembers: memberCount || 0,
    totalEvents: eventCount || 0,
    totalAttendance: attendanceCount || 0,
    avgAttendance,
    maleCount,
    femaleCount,
    adminRegistered,
    selfRegistered,
  }
}

export async function getAgeDistribution(branchId?: string) {
  const supabase = createAdminClient()

  let query = supabase
    .from('members')
    .select('date_of_birth, gender')

  if (branchId) {
    query = query.eq('branch_id', branchId)
  }

  const { data: members } = await query

  if (!members) return []

  // Calculate age and group
  const ageGroups = {
    '0-12': { total: 0, male: 0, female: 0 },
    '13-18': { total: 0, male: 0, female: 0 },
    '19-35': { total: 0, male: 0, female: 0 },
    '36-60': { total: 0, male: 0, female: 0 },
    '60+': { total: 0, male: 0, female: 0 },
  }

  members.forEach((member) => {
    const age = calculateAge(member.date_of_birth)
    let group: keyof typeof ageGroups

    if (age <= 12) group = '0-12'
    else if (age <= 18) group = '13-18'
    else if (age <= 35) group = '19-35'
    else if (age <= 60) group = '36-60'
    else group = '60+'

    ageGroups[group].total++
    if (member.gender === 'Male') {
      ageGroups[group].male++
    } else {
      ageGroups[group].female++
    }
  })

  return Object.entries(ageGroups).map(([name, data]) => ({
    name,
    total: data.total,
    male: data.male,
    female: data.female,
  }))
}

export async function getAttendanceTrends(branchId?: string, daysBack: number = 90) {
  const supabase = createAdminClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysBack)

  let query = supabase
    .from('events')
    .select(`
      id,
      title,
      event_date,
      branch_id,
      attendance (
        id,
        checked_in_at
      )
    `)
    .gte('event_date', startDate.toISOString())
    .order('event_date', { ascending: true })

  if (branchId) {
    query = query.eq('branch_id', branchId)
  }

  const { data: events } = await query

  if (!events) return []

  return events.map((event) => ({
    date: new Date(event.event_date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    fullDate: event.event_date,
    event: event.title,
    attendance: Array.isArray(event.attendance) ? event.attendance.length : 0,
  }))
}

export async function getTopAttendees(branchId?: string, limit: number = 10) {
  const supabase = createAdminClient()

  let query = supabase
    .from('members')
    .select(`
      id,
      full_name,
      phone_number,
      branch_id,
      attendance (
        id,
        checked_in_at
      )
    `)

  if (branchId) {
    query = query.eq('branch_id', branchId)
  }

  const { data: members } = await query

  if (!members) return []

  // Calculate attendance count and sort
  const membersWithCount = members
    .map((member) => ({
      id: member.id,
      name: member.full_name,
      phone: member.phone_number,
      attendanceCount: Array.isArray(member.attendance) ? member.attendance.length : 0,
      lastAttendance: Array.isArray(member.attendance) && member.attendance.length > 0
        ? member.attendance[member.attendance.length - 1].checked_in_at
        : null,
    }))
    .sort((a, b) => b.attendanceCount - a.attendanceCount)
    .slice(0, limit)

  return membersWithCount
}

export async function getMemberAttendanceHistory(memberId: string) {
  const supabase = createAdminClient()

  const { data: attendance, error } = await supabase
    .from('attendance')
    .select(`
      *,
      events (
        id,
        title,
        event_date,
        branches (
          name
        )
      )
    `)
    .eq('member_id', memberId)
    .order('checked_in_at', { ascending: false })

  if (error) {
    console.error('getMemberAttendanceHistory error:', error)
  }

  return attendance || []
}

export async function getAttendanceRate(branchId?: string) {
  const supabase = createAdminClient()

  // Get all events (both active and closed) ordered by most recent
  let query = supabase
    .from('events')
    .select(`
      id,
      event_date,
      branch_id,
      attendance (
        id
      )
    `)
    .order('event_date', { ascending: false })
    .limit(20)

  if (branchId) {
    query = query.eq('branch_id', branchId)
  }

  const { data: events } = await query

  if (!events || events.length === 0) return 0

  // Only consider events that actually had at least one check-in
  const eventsWithAttendance = events.filter(
    (e) => Array.isArray(e.attendance) && e.attendance.length > 0
  )

  if (eventsWithAttendance.length === 0) return 0

  // Get total members for the branch
  let memberQuery = supabase
    .from('members')
    .select('id', { count: 'exact', head: true })

  if (branchId) {
    memberQuery = memberQuery.eq('branch_id', branchId)
  }

  const { count: totalMembers } = await memberQuery

  if (!totalMembers) return 0

  // Calculate average attendance rate across events that had attendance
  const rates = eventsWithAttendance.map((event) => {
    const attendanceCount = Array.isArray(event.attendance) ? event.attendance.length : 0
    return (attendanceCount / totalMembers) * 100
  })

  const avgRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length

  return Math.round(avgRate * 10) / 10 // Round to 1 decimal
}

// Helper function
function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}
