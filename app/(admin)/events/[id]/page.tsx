import { notFound } from 'next/navigation'
import { getEventById } from '@/lib/actions/events'
import { getAttendanceByEvent } from '@/lib/actions/attendance'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Users, Clock, MapPin, TrendingUp, QrCode } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils/helpers'
import { Badge } from '@/components/ui/badge'
import EventQRCode from '@/components/admin/EventQRCode'
import EventAttendanceList from '@/components/admin/EventAttendanceList'
import EventDemographics from '@/components/admin/EventDemographics'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params
  
  try {
    const [event, attendance] = await Promise.all([
      getEventById(id),
      getAttendanceByEvent(id),
    ])

    if (!event) {
      notFound()
    }

    const totalAttendees = attendance.length
    const maleCount = attendance.filter((a) => a.members?.gender === 'Male').length
    const femaleCount = attendance.filter((a) => a.members?.gender === 'Female').length

    // Calculate age distribution for this event
    const ageGroups = {
      '0-12': 0,
      '13-18': 0,
      '19-35': 0,
      '36-60': 0,
      '60+': 0,
    }

    attendance.forEach((record) => {
      if (record.members?.date_of_birth) {
        const age = Math.floor(
          (Date.now() - new Date(record.members.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365)
        )
        if (age <= 12) ageGroups['0-12']++
        else if (age <= 18) ageGroups['13-18']++
        else if (age <= 35) ageGroups['19-35']++
        else if (age <= 60) ageGroups['36-60']++
        else ageGroups['60+']++
      }
    })

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Link href="/events">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold font-heading">{event.title}</h1>
                <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                  {event.status}
                </Badge>
              </div>
              <p className="text-gray-600 mt-1">{event.description || 'No description'}</p>
            </div>
          </div>
        </div>

        {/* Event Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Attendance
              </CardTitle>
              <Users className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAttendees}</div>
              <p className="text-xs text-gray-500 mt-1">
                checked in
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Male Attendees
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{maleCount}</div>
              <p className="text-xs text-gray-500 mt-1">
                {totalAttendees > 0 ? Math.round((maleCount / totalAttendees) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Female Attendees
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{femaleCount}</div>
              <p className="text-xs text-gray-500 mt-1">
                {totalAttendees > 0 ? Math.round((femaleCount / totalAttendees) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Event Status
              </CardTitle>
              <QrCode className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{event.status}</div>
              <p className="text-xs text-gray-500 mt-1">
                {event.status === 'active' ? 'Check-ins open' : 'Check-ins closed'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Event Details and QR Code */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Event Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-heading">Event Details</CardTitle>
              <CardDescription>Date, time, and location information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Event Date</p>
                    <p className="font-medium">{formatDate(event.event_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Start Time</p>
                    <p className="font-medium">{event.start_time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Branch</p>
                    <p className="font-medium">{event.branches?.name || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{event.branches?.location || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code */}
          <EventQRCode event={event} />
        </div>

        {/* Demographics */}
        <EventDemographics
          maleCount={maleCount}
          femaleCount={femaleCount}
          ageGroups={ageGroups}
        />

        {/* Attendance List */}
        <EventAttendanceList
          eventId={id}
          initialAttendance={attendance}
          eventTitle={event.title}
          eventDate={event.event_date}
          branchName={event.branches?.name || ''}
        />
      </div>
    )
  } catch (error) {
    console.error('Error loading event details:', error)
    notFound()
  }
}
