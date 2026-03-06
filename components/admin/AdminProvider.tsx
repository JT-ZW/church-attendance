'use client'

import { createContext, useContext } from 'react'
import type { AdminRole } from '@/lib/types/database.types'

interface AdminContextValue {
  role: AdminRole | null
  branchId: string | null
  isSuperAdmin: boolean
  isBranchAdmin: boolean
}

const AdminContext = createContext<AdminContextValue>({
  role: null,
  branchId: null,
  isSuperAdmin: false,
  isBranchAdmin: false,
})

export function AdminProvider({
  children,
  role,
  branchId,
}: {
  children: React.ReactNode
  role: AdminRole | null
  branchId: string | null
}) {
  return (
    <AdminContext.Provider
      value={{
        role,
        branchId,
        isSuperAdmin: role === 'super_admin',
        isBranchAdmin: role === 'branch_admin',
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdminContext() {
  return useContext(AdminContext)
}
