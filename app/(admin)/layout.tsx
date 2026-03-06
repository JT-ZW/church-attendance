import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { AdminProvider } from '@/components/admin/AdminProvider'
import { getCurrentAdminProfile } from '@/lib/actions/users'
import type { AdminRole } from '@/lib/types/database.types'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getCurrentAdminProfile()
  const role: AdminRole | null = profile?.role ?? null
  const branchId: string | null = profile?.branch_id ?? null

  return (
    <AdminProvider role={role} branchId={branchId}>
      <div className="flex h-screen bg-gray-100">
        <AdminSidebar user={user} role={role} />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </AdminProvider>
  )
}
