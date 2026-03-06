import { redirect } from 'next/navigation'
import { getCurrentAdminProfile } from '@/lib/actions/users'
import UsersTable from '@/components/admin/UsersTable'

export default async function UsersPage() {
  const profile = await getCurrentAdminProfile()

  if (!profile || profile.role !== 'super_admin') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500 mt-1">
          Create and manage admin users. Assign roles and branch access.
        </p>
      </div>
      <UsersTable />
    </div>
  )
}
