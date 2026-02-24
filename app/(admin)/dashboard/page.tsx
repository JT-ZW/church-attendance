import { Suspense } from 'react'
import DashboardStats from '@/components/admin/DashboardStats'
import RecentEvents from '@/components/admin/RecentEvents'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of church attendance and activities</p>
      </div>

      <Suspense fallback={<div>Loading dashboard...</div>}>
        <DashboardStats />
      </Suspense>

      <Suspense fallback={<div>Loading recent events...</div>}>
        <RecentEvents />
      </Suspense>
    </div>
  )
}
