'use client'

import { Trophy, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime, maskPhoneNumber } from '@/lib/utils/helpers'

interface TopAttendee {
  id: string
  name: string
  phone: string
  attendanceCount: number
  lastAttendance: string | null
}

interface TopAttendeesListProps {
  attendees: TopAttendee[]
}

export default function TopAttendeesList({ attendees }: TopAttendeesListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          <CardTitle className="font-heading">Top Attendees</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {attendees.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No attendance data yet</p>
        ) : (
          <div className="space-y-3">
            {attendees.map((attendee, index) => (
              <div
                key={attendee.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{attendee.name}</p>
                    <p className="text-sm text-gray-500">
                      {maskPhoneNumber(attendee.phone)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-blue-600">
                    {attendee.attendanceCount}
                  </p>
                  <p className="text-xs text-gray-500">events</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
