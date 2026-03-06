'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, QrCode, Eye, Calendar, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { getEvents, deleteEvent, toggleEventStatus } from '@/lib/actions/events'
import { getBranches } from '@/lib/actions/branches'
import type { Event, Branch } from '@/lib/types/database.types'
import { formatDateTime } from '@/lib/utils/helpers'
import EventForm from '@/components/admin/EventForm'
import EventQRCode from '@/components/admin/EventQRCode'
import { useAdminContext } from '@/components/admin/AdminProvider'

export default function EventsTable() {
  const router = useRouter()
  const { branchId, isBranchAdmin } = useAdminContext()
  const [events, setEvents] = useState<Event[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  useEffect(() => {
    loadData()
  }, [branchId])

  async function loadData() {
    try {
      const [eventsData, branchesData] = await Promise.all([
        getEvents(branchId ?? undefined),
        getBranches(),
      ])
      setEvents(eventsData)
      setBranches(branchesData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this event?')) return

    const result = await deleteEvent(id)
    if (!result.error) {
      await loadData()
    } else {
      alert(result.error)
    }
  }

  async function handleToggleStatus(event: Event) {
    const result = await toggleEventStatus(event.id, !event.is_active)
    if (!result.error) {
      await loadData()
    } else {
      alert(result.error)
    }
  }

  function handleShowQR(event: Event) {
    setSelectedEvent(event)
    setQrDialogOpen(true)
  }

  function handleViewDetails(eventId: string) {
    router.push(`/events/${eventId}`)
  }

  function handleDialogClose(success: boolean) {
    setDialogOpen(false)
    if (success) {
      loadData()
    }
  }

  if (loading) {
    return <div>Loading events...</div>
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-500">Total Events</p>
            <p className="text-2xl font-bold">{events.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-500">Active Events</p>
            <p className="text-2xl font-bold text-green-600">
              {events.filter((e) => e.is_active).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-500">Closed Events</p>
            <p className="text-2xl font-bold text-gray-500">
              {events.filter((e) => !e.is_active).length}
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Fill in the event details below
              </DialogDescription>
            </DialogHeader>
            <EventForm
              branches={branches}
              lockedBranchId={isBranchAdmin ? branchId : null}
              onSuccess={() => handleDialogClose(true)}
              onCancel={() => handleDialogClose(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-md">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEvent.title}</DialogTitle>
                <DialogDescription>
                  Scan this QR code to check in to the event
                </DialogDescription>
              </DialogHeader>
              <EventQRCode event={selectedEvent} />
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No events found. Create your first event!
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{event.title}</p>
                      {event.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {branches.find((b) => b.id === event.branch_id)?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDateTime(event.event_date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={event.is_active ? 'default' : 'secondary'}>
                      {event.is_active ? 'Active' : 'Closed'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShowQR(event)}
                        title="Show QR Code"
                      >
                        <QrCode className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(event.id)}
                        title="View Details"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(event)}
                        title={event.is_active ? 'Close Event' : 'Activate Event'}
                      >
                        {event.is_active ? (
                          <ToggleRight className="h-3 w-3 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-3 w-3 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(event.id)}
                        title="Delete Event"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
