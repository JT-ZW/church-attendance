import { Suspense } from 'react'
import EventsTable from '@/components/admin/EventsTable'

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading">Events</h1>
        <p className="text-gray-600 mt-1">Create and manage church events</p>
      </div>

      <Suspense fallback={<div>Loading events...</div>}>
        <EventsTable />
      </Suspense>
    </div>
  )
}
