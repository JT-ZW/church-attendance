import { redirect } from 'next/navigation'
import { getEventByToken } from '@/lib/actions/events'
import CheckInForm from '@/components/public/CheckInForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, MapPin, Church } from 'lucide-react'
import { formatDateTime } from '@/lib/utils/helpers'

export default async function CheckInPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  let event
  
  try {
    event = await getEventByToken(token)
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-gray-50 to-slate-100 px-4">
        <Card className="w-full max-w-md border-gray-200">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-xl bg-gray-900 flex items-center justify-center">
                <Church className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-center text-red-600 font-heading">Event Not Found</CardTitle>
            <CardDescription className="text-center">
              The event you're trying to check in to doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!event.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-gray-50 to-slate-100 px-4">
        <Card className="w-full max-w-md border-gray-200">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-xl bg-gray-900 flex items-center justify-center">
                <Church className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-center text-yellow-600 font-heading">Event Closed</CardTitle>
            <CardDescription className="text-center">
              This event is no longer accepting check-ins.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-2">
              <p className="font-semibold font-heading">{event.title}</p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                {formatDateTime(event.event_date)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-gray-50 to-slate-100 px-4 py-8">
      <div className="w-full max-w-md space-y-4">
        {/* Event Info Card */}
        <Card className="border-gray-200">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-lg bg-gray-900 flex items-center justify-center">
                <Church className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-heading">{event.title}</CardTitle>
            <CardDescription>
              {event.description || 'Check in to mark your attendance'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              {formatDateTime(event.event_date)}
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              {event.branches?.location || 'Location TBD'}
            </div>
          </CardContent>
        </Card>

        {/* Check-in Form Card */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-center font-heading">Check In</CardTitle>
            <CardDescription className="text-center">
              Search for your name to mark attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CheckInForm event={event} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
