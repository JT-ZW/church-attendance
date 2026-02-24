import { Suspense } from 'react'
import MembersTable from '@/components/admin/MembersTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function MembersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading">Members</h1>
        <p className="text-gray-600 mt-1">Manage church members and registrations</p>
      </div>

      <Suspense fallback={<div>Loading members...</div>}>
        <MembersTable />
      </Suspense>
    </div>
  )
}
