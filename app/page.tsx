import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, LogIn, QrCode, Church } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Header Section */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Church className="h-8 w-8 text-gray-900" />
              <div>
                <h1 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">
                  The OAC
                </h1>
                <p className="text-sm text-gray-600 uppercase tracking-wider">
                  Old Apostolic Church
                </p>
              </div>
            </div>
            <Link href="/login">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <LogIn className="h-4 w-4 mr-2" />
                Admin Login
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl sm:text-5xl font-serif font-bold text-gray-900 tracking-tight">
            Attendance & Member Management
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Strengthening fellowship through organized attendance tracking and comprehensive member care
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Register Card */}
          <Card className="hover:shadow-xl transition-all duration-300 border-gray-200 hover:border-gray-300">
            <CardHeader className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-gray-900 rounded-2xl">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-center text-2xl">New Member</CardTitle>
                <CardDescription className="text-center text-base">
                  Join our church community and register your details
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/register">
                <Button className="w-full bg-gray-500 hover:bg-gray-800" size="lg">
                  Register Now
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Check-in Card */}
          <Card className="hover:shadow-xl transition-all duration-300 border-gray-200 hover:border-gray-300 ring-2 ring-gray-900">
            <CardHeader className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-gray-900 rounded-2xl">
                  <QrCode className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-center text-2xl">Event Check-in</CardTitle>
                <CardDescription className="text-center text-base">
                  Scan QR code to mark your attendance
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Scan the QR code displayed at church events to mark your attendance
                </p>
                <Button variant="outline" className="w-full" size="lg" disabled>
                  Available at Events
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Admin Access Card */}
          <Card className="hover:shadow-xl transition-all duration-300 border-gray-200 hover:border-gray-300">
            <CardHeader className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-slate-100 rounded-2xl">
                  <LogIn className="h-8 w-8 text-gray-900" />
                </div>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-center text-2xl">Admin Portal</CardTitle>
                <CardDescription className="text-center text-base">
                  Manage members, events, and analytics
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/login">
                <Button variant="outline" className="w-full border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white" size="lg">
                  Access Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl mb-2">Platform Features</CardTitle>
              <CardDescription className="text-base">
                Comprehensive tools for church administration and member engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">QR-Based Check-ins</h3>
                      <p className="text-sm text-gray-600">Quick and contactless attendance tracking for all events</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Real-Time Updates</h3>
                      <p className="text-sm text-gray-600">Live attendance data and instant member registration</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Self-Registration</h3>
                      <p className="text-sm text-gray-600">Members can register themselves with phone verification</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Multi-Branch Support</h3>
                      <p className="text-sm text-gray-600">Manage multiple church locations from one platform</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Advanced Analytics</h3>
                      <p className="text-sm text-gray-600">Insights on attendance trends and member demographics</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Secure Dashboard</h3>
                      <p className="text-sm text-gray-600">Protected admin access with comprehensive management tools</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pb-8">
          <p className="text-sm text-gray-500">
            © 2026 The Old Apostolic Church. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
