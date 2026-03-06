'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Calendar,
  MapPin,
  BarChart3,
  LogOut,
  Church,
  ShieldCheck,
  Menu,
  X,
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
  { name: 'Dashboard',      href: '/dashboard', icon: LayoutDashboard, superAdminOnly: false },
  { name: 'Members',        href: '/members',   icon: Users,           superAdminOnly: false },
  { name: 'Events',         href: '/events',    icon: Calendar,        superAdminOnly: false },
  { name: 'Branches',       href: '/branches',  icon: MapPin,          superAdminOnly: true  },
  { name: 'Analytics',      href: '/analytics', icon: BarChart3,       superAdminOnly: false },
  { name: 'User Management',href: '/users',     icon: ShieldCheck,     superAdminOnly: true  },
]

function SidebarContent({
  user,
  role,
  navigation,
  pathname,
  onNavClick,
}: {
  user: User
  role: AdminRole | null
  navigation: typeof allNavItems
  pathname: string
  onNavClick?: () => void
}) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex flex-col items-center justify-center h-20 border-b border-gray-200 px-4 shrink-0">
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
                onClick={onNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Info & Logout */}
      <div className="border-t p-4 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium shrink-0">
            {user.email?.[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{user.email}</p>
            <p className="text-xs text-gray-500 capitalize">
              {role ? role.replace('_', ' ') : 'Admin'}
            </p>
          </div>
        </div>
        <Button
          onClick={() => logout()}
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

export default function AdminSidebar({ user, role }: AdminSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isSuperAdmin = role === 'super_admin'

  const navigation = allNavItems.filter((item) => !item.superAdminOnly || isSuperAdmin)

  return (
    <>
      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <div className="hidden md:flex flex-col w-64 border-r border-gray-200 shrink-0">
        <SidebarContent user={user} role={role} navigation={navigation} pathname={pathname} />
      </div>

      {/* ── Mobile: top bar with hamburger ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Church className="h-5 w-5 text-gray-900" />
          <span className="text-lg font-serif font-bold text-gray-900">The OAC</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          onClick={() => setMobileOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Drawer panel */}
          <div
            className="relative w-72 max-w-[85vw] h-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 z-10 p-1 rounded-md text-gray-500 hover:bg-gray-100"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent
              user={user}
              role={role}
              navigation={navigation}
              pathname={pathname}
              onNavClick={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}

