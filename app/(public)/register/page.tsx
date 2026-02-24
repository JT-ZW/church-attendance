'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { checkPhoneExists, registerMember } from '@/lib/actions/members'
import { getBranches } from '@/lib/actions/branches'
import type { Branch } from '@/lib/types/database.types'
import { maskPhoneNumber } from '@/lib/utils/helpers'

export default function RegisterPage() {
  const router = useRouter()
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [phoneCheckStatus, setPhoneCheckStatus] = useState<'idle' | 'checking' | 'exists' | 'available'>('idle')
  const [existingMember, setExistingMember] = useState<any>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    gender: '',
    date_of_birth: '',
    phone_number: '',
    home_address: '',
    branch_id: '',
    email: '',
    baptism_year: '',
  })

  useEffect(() => {
    async function loadBranches() {
      try {
        const data = await getBranches()
        setBranches(data)
        // Auto-select first branch if only one exists
        if (data.length === 1) {
          setFormData((prev) => ({ ...prev, branch_id: data[0].id }))
        }
      } catch (err) {
        console.error('Failed to load branches:', err)
      }
    }
    loadBranches()
  }, [])

  const handlePhoneCheck = async (phone: string) => {
    if (phone.length < 10) {
      setPhoneCheckStatus('idle')
      return
    }

    setPhoneCheckStatus('checking')
    try {
      const existing = await checkPhoneExists(phone)
      if (existing) {
        setPhoneCheckStatus('exists')
        setExistingMember(existing)
      } else {
        setPhoneCheckStatus('available')
        setExistingMember(null)
      }
    } catch (err) {
      setPhoneCheckStatus('idle')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (phoneCheckStatus === 'exists') {
      setError('This phone number is already registered')
      return
    }

    setLoading(true)

    try {
      const result = await registerMember({
        full_name: formData.full_name,
        gender: formData.gender as 'Male' | 'Female',
        date_of_birth: formData.date_of_birth,
        phone_number: formData.phone_number,
        home_address: formData.home_address,
        branch_id: formData.branch_id,
        email: formData.email || null,
        baptism_year: formData.baptism_year ? parseInt(formData.baptism_year) : null,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        // Reset form
        setFormData({
          full_name: '',
          gender: '',
          date_of_birth: '',
          phone_number: '',
          home_address: '',
          branch_id: branches.length === 1 ? branches[0].id : '',
          email: '',
          baptism_year: '',
        })
        setPhoneCheckStatus('idle')
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 px-4">
        <Card className="w-full max-w-md border-gray-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-green-600">Registration Successful!</CardTitle>
            <CardDescription className="text-center">
              Welcome to our church community. You can now check in to events using your phone number.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setSuccess(false)}
              className="w-full"
            >
              Register Another Member
            </Button>
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 px-4 py-8">
      <Card className="w-full max-w-2xl border-gray-200 shadow-xl">
        <CardHeader className="text-center space-y-3">
          <CardTitle className="text-3xl font-serif">Member Registration</CardTitle>
          <CardDescription className="text-base">
            Join our church community by registering below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Number - First for validation */}
            <div className="space-y-2">
              <Label htmlFor="phone_number">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone_number"
                type="tel"
                placeholder="+263 77 123 4567"
                value={formData.phone_number}
                onChange={(e) => {
                  setFormData({ ...formData, phone_number: e.target.value })
                  handlePhoneCheck(e.target.value)
                }}
                required
                disabled={loading}
              />
              {phoneCheckStatus === 'checking' && (
                <p className="text-sm text-gray-500">Checking availability...</p>
              )}
              {phoneCheckStatus === 'exists' && existingMember && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  This phone number is already registered. Please use a different number or contact the administrator.
                </div>
              )}
              {phoneCheckStatus === 'available' && (
                <p className="text-sm text-green-600">✓ Phone number available</p>
              )}
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                type="text"
                placeholder="John Doe"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">
                Gender <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
                disabled={loading}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">
                Date of Birth <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                required
                disabled={loading}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Baptism Year */}
            <div className="space-y-2">
              <Label htmlFor="baptism_year">Baptism Year (Optional)</Label>
              <Input
                id="baptism_year"
                type="number"
                placeholder={String(new Date().getFullYear())}
                min="1900"
                max={new Date().getFullYear()}
                value={formData.baptism_year}
                onChange={(e) => setFormData({ ...formData, baptism_year: e.target.value })}
                disabled={loading}
              />
            </div>

            {/* Branch */}
            <div className="space-y-2">
              <Label htmlFor="branch_id">
                Branch <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.branch_id}
                onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
                disabled={loading || branches.length === 1}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name} - {branch.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Home Address */}
            <div className="space-y-2">
              <Label htmlFor="home_address">
                Home Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="home_address"
                type="text"
                placeholder="123 Main Street, City"
                value={formData.home_address}
                onChange={(e) => setFormData({ ...formData, home_address: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            {/* Email (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              disabled={loading || phoneCheckStatus === 'exists' || phoneCheckStatus === 'checking'}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
