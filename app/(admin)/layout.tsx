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
        {/* pt-14 on mobile offsets the fixed top bar; md:pt-0 removes it on desktop */}
        <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
          <div className="container mx-auto p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </AdminProvider>
  )
}
