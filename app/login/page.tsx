'use client'

import { Suspense, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { login } from '@/lib/actions/auth'
import { Church, ArrowLeft, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

const MAX_ATTEMPTS = 5
const LOCKOUT_SECONDS = 30

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionExpired = searchParams.get('reason') === 'inactivity'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Rate limiting state (client-side, bruteforce UX guard)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [lockCountdown, setLockCountdown] = useState(0)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function startLockoutCountdown(until: number) {
    if (countdownRef.current) clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      const remaining = Math.ceil((until - Date.now()) / 1000)
      if (remaining <= 0) {
        clearInterval(countdownRef.current!)
        setLockedUntil(null)
        setLockCountdown(0)
        setAttempts(0)
      } else {
        setLockCountdown(remaining)
      }
    }, 500)
  }

  const isLockedOut = lockedUntil !== null && Date.now() < lockedUntil

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLockedOut) return

    setError(null)
    setLoading(true)

    const { error: loginError } = await login(email, password)

    if (loginError) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setLoading(false)

      if (newAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_SECONDS * 1000
        setLockedUntil(until)
        setLockCountdown(LOCKOUT_SECONDS)
        startLockoutCountdown(until)
        setError(`Too many failed attempts. Please wait ${LOCKOUT_SECONDS} seconds.`)
      } else {
        setError(`${loginError} (${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts === 1 ? '' : 's'} remaining)`)
      }
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-gray-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {sessionExpired && (
          <div className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-md text-center">
            Your session expired after 30 minutes of inactivity. Please sign in again.
          </div>
        )}

        <Card className="border-gray-200 shadow-xl">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="flex justify-center">
              <div className="p-3 bg-gray-900 rounded-2xl">
                <Church className="h-10 w-10 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-3xl font-serif">Admin Login</CardTitle>
              <CardDescription className="text-base mt-2">
                The Old Apostolic Church
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4" suppressHydrationWarning>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || isLockedOut}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || isLockedOut}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isLockedOut && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-md">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Too many failed attempts. Try again in {lockCountdown}s.
                </div>
              )}

              {error && !isLockedOut && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gray-900 hover:bg-gray-800"
                disabled={loading || isLockedOut}
              >
                {loading ? 'Signing in...' : isLockedOut ? `Wait ${lockCountdown}s` : 'Sign In'}
              </Button>

              <p className="text-center text-sm text-gray-500">
                Forgot your password?{' '}
                <Link href="/reset-password" className="text-gray-900 underline underline-offset-4 hover:text-gray-700">
                  Reset it
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

