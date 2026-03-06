'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { sendPasswordReset } from '@/lib/actions/users'
import { changePassword } from '@/lib/actions/auth'
import { Church, Eye, EyeOff, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

// Two modes:
//  'request' — user enters their email to receive a reset link
//  'set'     — user arrived via the recovery email link (?mode=set) and sets a new password
type PageMode = 'request' | 'set'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // The /auth/callback route adds ?mode=set after exchanging the code
  const modeParam = searchParams.get('mode')
  // The /auth/callback route adds ?error=invalid_link if something went wrong
  const errorParam = searchParams.get('error')

  const [mode, setMode] = useState<PageMode>(modeParam === 'set' ? 'set' : 'request')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(
    errorParam === 'invalid_link'
      ? 'This reset link is invalid or has expired. Please request a new one.'
      : null
  )

  // Request mode
  const [email, setEmail] = useState('')

  // Set mode
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // ---- Request email form handler ----
  async function handleRequest(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: resetError } = await sendPasswordReset(email)

    setLoading(false)

    if (resetError) {
      setError(resetError)
    } else {
      setSuccess(true)
    }
  }

  // ---- Set new password handler ----
  // The session is already active because /auth/callback exchanged the code before redirecting here.
  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const { error: changeError } = await changePassword(password)
    setLoading(false)

    if (changeError) {
      setError(changeError)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2500)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-gray-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Button>
          </Link>
        </div>

        <Card className="border-gray-200 shadow-xl">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex justify-center">
              <div className="p-3 bg-gray-900 rounded-2xl">
                <Church className="h-10 w-10 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-serif">
                {mode === 'request' ? 'Reset Password' : 'Set New Password'}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {mode === 'request'
                  ? "Enter your email and we'll send you a reset link"
                  : 'Choose a new strong password for your account'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {/* ---- Success states ---- */}
            {success && mode === 'request' && (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="font-medium text-gray-900">Check your inbox</p>
                <p className="text-sm text-gray-500">
                  A password reset link has been sent to <strong>{email}</strong>. Check your
                  spam folder if you don't see it within a few minutes.
                </p>
                <Link href="/login">
                  <Button variant="outline" className="mt-2">Back to Login</Button>
                </Link>
              </div>
            )}

            {success && mode === 'set' && (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="font-medium text-gray-900">Password updated!</p>
                <p className="text-sm text-gray-500">Redirecting you to login…</p>
              </div>
            )}

            {/* ---- Invalid / expired link state ---- */}
            {!success && errorParam === 'invalid_link' && mode === 'request' && (
              <div className="flex items-start gap-3 mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-md">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  That reset link has expired or was already used. Enter your email below to
                  request a fresh one.
                </span>
              </div>
            )}

            {/* ---- Request email form ---- */}
            {!success && mode === 'request' && (
              <form onSubmit={handleRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                {error && errorParam !== 'invalid_link' && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gray-900 hover:bg-gray-800"
                  disabled={loading}
                >
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </Button>
              </form>
            )}

            {/* ---- Set new password form ---- */}
            {!success && mode === 'set' && (
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
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

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repeat new password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      tabIndex={-1}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password strength hints */}
                {password.length > 0 && (
                  <ul className="text-xs space-y-1 text-gray-500">
                    <li className={password.length >= 8 ? 'text-green-600' : ''}>
                      {password.length >= 8 ? '✓' : '○'} At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                      {/[A-Z]/.test(password) ? '✓' : '○'} Uppercase letter
                    </li>
                    <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
                      {/[0-9]/.test(password) ? '✓' : '○'} Number
                    </li>
                  </ul>
                )}

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gray-900 hover:bg-gray-800"
                  disabled={loading}
                >
                  {loading ? 'Updating…' : 'Update Password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
