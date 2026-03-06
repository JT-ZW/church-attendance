'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  MapPin, 
  BarChart3, 
  LogOut,
  Church,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/actions/auth'
import type { User } from '@supabase/supabase-js'
import type { AdminRole } from '@/lib/types/database.types'

interface AdminSidebarProps {
  user: User
  role: AdminRole | null
}

const allNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, superAdminOnly: false },
  { name: 'Members', href: '/members', icon: Users, superAdminOnly: false },
  { name: 'Events', href: '/events', icon: Calendar, superAdminOnly: false },
  { name: 'Branches', href: '/branches', icon: MapPin, superAdminOnly: true },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, superAdminOnly: false },
  { name: 'User Management', href: '/users', icon: ShieldCheck, superAdminOnly: true },
]

export default function AdminSidebar({ user, role }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isSuperAdmin = role === 'super_admin'

  const navigation = allNavItems.filter(
    (item) => !item.superAdminOnly || isSuperAdmin
  )

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex flex-col items-center justify-center h-20 border-b border-gray-200 px-4">
        <div className="flex items-center gap-2">
          <Church className="h-6 w-6 text-gray-900" />
          <h1 className="text-2xl font-serif font-bold text-gray-900">The OAC</h1>
        </div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Admin Portal</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-3">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                  transition-colors
                  ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Info & Logout */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
            {user.email?.[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">
              {user.email}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {role ? role.replace('_', ' ') : 'Admin'}
            </p>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-start"
          size="sm"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )
}

