import { Suspense } from 'react'
import BranchesTable from '@/components/admin/BranchesTable'

export default function BranchesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading">Branches</h1>
        <p className="text-gray-600 mt-1">Manage church branches and locations</p>
      </div>

      <Suspense fallback={<div>Loading branches...</div>}>
        <BranchesTable />
      </Suspense>
    </div>
  )
}
