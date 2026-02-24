'use client'

import { useEffect, useState } from 'react'
import { Users, Calendar, MapPin, UserCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getMembers } from '@/lib/actions/members'
import { getEvents } from '@/lib/actions/events'
import { getBranches } from '@/lib/actions/branches'
import { createClient } from '@/lib/supabase/client'

interface DashboardData {
  totalMembers: number
  totalEvents: number
  totalBranches: number
  totalAttendance: number
  maleMembers: number
  femaleMembers: number
  activeEvents: number
}

export default function DashboardStats() {
  const [data, setData] = useState<DashboardData>({
    totalMembers: 0,
    totalEvents: 0,
    totalBranches: 0,
    totalAttendance: 0,
    maleMembers: 0,
    femaleMembers: 0,
    activeEvents: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [members, events, branches] = await Promise.all([
        getMembers(),
        getEvents(),
        getBranches(),
      ])

      const supabase = createClient()
      const { count: attendanceCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })

      setData({
        totalMembers: members.length,
        totalEvents: events.length,
        totalBranches: branches.length,
        totalAttendance: attendanceCount || 0,
        maleMembers: members.filter((m) => m.gender === 'Male').length,
        femaleMembers: members.filter((m) => m.gender === 'Female').length,
        activeEvents: events.filter((e) => e.is_active).length,
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading stats...</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Members
          </CardTitle>
          <Users className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalMembers}</div>
          <p className="text-xs text-gray-500 mt-1">
            {data.maleMembers} male, {data.femaleMembers} female
          </p>
        </CardContent>
      </Card>

      {/* Total Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Events
          </CardTitle>
          <Calendar className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalEvents}</div>
          <p className="text-xs text-gray-500 mt-1">
            {data.activeEvents} currently active
          </p>
        </CardContent>
      </Card>

      {/* Total Branches */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Branches
          </CardTitle>
          <MapPin className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalBranches}</div>
          <p className="text-xs text-gray-500 mt-1">
            Church locations
          </p>
        </CardContent>
      </Card>

      {/* Total Attendance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Attendance
          </CardTitle>
          <UserCheck className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalAttendance}</div>
          <p className="text-xs text-gray-500 mt-1">
            All-time check-ins
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
