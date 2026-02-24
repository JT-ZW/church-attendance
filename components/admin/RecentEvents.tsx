'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, MapPin, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getEvents } from '@/lib/actions/events'
import { getEventStats } from '@/lib/actions/events'
import { formatDateTime } from '@/lib/utils/helpers'
import type { Event } from '@/lib/types/database.types'

interface EventWithStats extends Event {
  branches?: {
    id: string
    name: string
    location: string
  }
  stats?: {
    totalAttendees: number
  }
}

export default function RecentEvents() {
  const router = useRouter()
  const [events, setEvents] = useState<EventWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    try {
      const eventsData = await getEvents()
      
      // Get stats for each event
      const eventsWithStats = await Promise.all(
        eventsData.slice(0, 5).map(async (event) => {
          try {
            const stats = await getEventStats(event.id)
            return { ...event, stats: { totalAttendees: stats.totalAttendees } }
          } catch {
            return { ...event, stats: { totalAttendees: 0 } }
          }
        })
      )

      setEvents(eventsWithStats)
    } catch (error) {
      console.error('Failed to load events:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading events...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading">Recent Events</CardTitle>
          <Button variant="outline" size="sm" onClick={() => router.push('/events')}>
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No events yet</p>
            <Button
              variant="link"
              onClick={() => router.push('/events')}
              className="mt-2"
            >
              Create your first event
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => router.push(`/events/${event.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{event.title}</h3>
                      <Badge variant={event.is_active ? 'default' : 'secondary'}>
                        {event.is_active ? 'Active' : 'Closed'}
                      </Badge>
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {event.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateTime(event.event_date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.branches?.name || 'N/A'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {event.stats?.totalAttendees || 0} attendees
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
