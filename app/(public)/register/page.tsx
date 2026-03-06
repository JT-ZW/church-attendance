'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Users, User } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { checkPhoneExists, registerMember, registerFamilyGroup } from '@/lib/actions/members'
import type { FamilyMemberInput } from '@/lib/actions/members'
import { getBranches } from '@/lib/actions/branches'
import type { Branch } from '@/lib/types/database.types'

const emptyFamilyMember = (): FamilyMemberInput => ({
  full_name: '',
  gender: 'Male',
  date_of_birth: '',
  family_role: 'child',
  phone_number: '',
  email: '',
  baptism_year: null,
})

export default function RegisterPage() {
  const router = useRouter()
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [registeredCount, setRegisteredCount] = useState(1)
  const [phoneCheckStatus, setPhoneCheckStatus] = useState<'idle' | 'checking' | 'exists' | 'available'>('idle')

  // Registration type: individual or family group
  const [registrationType, setRegistrationType] = useState<'individual' | 'family'>('individual')

  // Primary registrant (head of family / individual)
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

  // Additional family members (only used when registrationType === 'family')
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberInput[]>([emptyFamilyMember()])

  useEffect(() => {
    async function loadBranches() {
      try {
        const data = await getBranches()
        setBranches(data)
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
      setPhoneCheckStatus(existing ? 'exists' : 'available')
    } catch {
      setPhoneCheckStatus('idle')
    }
  }

  const addFamilyMember = () => setFamilyMembers((prev) => [...prev, emptyFamilyMember()])

  const removeFamilyMember = (index: number) =>
    setFamilyMembers((prev) => prev.filter((_, i) => i !== index))

  const updateFamilyMember = (index: number, field: keyof FamilyMemberInput, value: string) =>
    setFamilyMembers((prev) =>
      prev.map((fm, i) => (i === index ? { ...fm, [field]: value } : fm))
    )

  const resetForm = (branchId: string) => {
    setFormData({
      full_name: '',
      gender: '',
      date_of_birth: '',
      phone_number: '',
      home_address: '',
      branch_id: branchId,
      email: '',
      baptism_year: '',
    })
    setFamilyMembers([emptyFamilyMember()])
    setPhoneCheckStatus('idle')
    setRegistrationType('individual')
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
      if (registrationType === 'individual') {
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
          setRegisteredCount(1)
          setSuccess(true)
          resetForm(formData.branch_id)
        }
      } else {
        // Family registration
        const validMembers = familyMembers.filter((fm) => fm.full_name.trim())
        if (validMembers.length === 0) {
          setError('Please add at least one family member, or switch to Individual registration.')
          setLoading(false)
          return
        }

        const result = await registerFamilyGroup(
          {
            full_name: formData.full_name,
            gender: formData.gender as 'Male' | 'Female',
            date_of_birth: formData.date_of_birth,
            phone_number: formData.phone_number,
            home_address: formData.home_address,
            branch_id: formData.branch_id,
            email: formData.email || null,
            baptism_year: formData.baptism_year ? parseInt(formData.baptism_year) : null,
          },
          validMembers.map((fm) => ({
            ...fm,
            phone_number: fm.phone_number || null,
            email: fm.email || null,
          }))
        )

        if (result.error) {
          setError(result.error)
        } else {
          setRegisteredCount(1 + validMembers.length)
          setSuccess(true)
          resetForm(formData.branch_id)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 px-4">
        <Card className="w-full max-w-md border-gray-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-green-600">Registration Successful!</CardTitle>
            <CardDescription className="text-center">
              {registeredCount === 1
                ? 'Welcome to our church community. You can now check in to events using your phone number.'
                : `Welcome! ${registeredCount} family members have been registered. The family head can check everyone in at events.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => setSuccess(false)} className="w-full">
              Register Another
            </Button>
            <Button onClick={() => router.push('/')} variant="outline" className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Registration form ───────────────────────────────────────────────────────
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
          {/* Registration type toggle */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setRegistrationType('individual')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                registrationType === 'individual'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              <User className="h-4 w-4" />
              Individual
            </button>
            <button
              type="button"
              onClick={() => setRegistrationType('family')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                registrationType === 'family'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              <Users className="h-4 w-4" />
              Family
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ── Primary registrant ── */}
            {registrationType === 'family' && (
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Your Details (Family Head)
              </p>
            )}

            {/* Phone Number */}
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
              {phoneCheckStatus === 'exists' && (
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

            <div className="grid grid-cols-2 gap-4">
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
                    <SelectValue placeholder="Select" />
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
                      {branch.name} — {branch.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Home Address */}
            <div className="space-y-2">
              <Label htmlFor="home_address">
                Home Address <span className="text-red-500">*</span>
                {registrationType === 'family' && (
                  <span className="text-gray-400 font-normal ml-1">(shared by all family members)</span>
                )}
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

            <div className="grid grid-cols-2 gap-4">
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

              {/* Email */}
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
            </div>

            {/* ── Family members section ── */}
            {registrationType === 'family' && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Family Members
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFamilyMember}
                    disabled={loading}
                    className="gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Member
                  </Button>
                </div>

                {familyMembers.map((fm, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-600">
                        Family Member {index + 1}
                      </p>
                      {familyMembers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFamilyMember(index)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Relationship */}
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">
                        Relationship <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={fm.family_role}
                        onValueChange={(v) => updateFamilyMember(index, 'family_role', v)}
                        disabled={loading}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Full Name */}
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs text-gray-500">
                          Full Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="text"
                          placeholder="Jane Doe"
                          value={fm.full_name}
                          onChange={(e) => updateFamilyMember(index, 'full_name', e.target.value)}
                          required
                          disabled={loading}
                          className="bg-white"
                        />
                      </div>

                      {/* Gender */}
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">
                          Gender <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={fm.gender}
                          onValueChange={(v) => updateFamilyMember(index, 'gender', v)}
                          disabled={loading}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Date of Birth */}
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">
                          Date of Birth <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          value={fm.date_of_birth}
                          onChange={(e) => updateFamilyMember(index, 'date_of_birth', e.target.value)}
                          required
                          disabled={loading}
                          max={new Date().toISOString().split('T')[0]}
                          className="bg-white"
                        />
                      </div>

                      {/* Phone (optional for dependents) */}
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Phone (Optional)</Label>
                        <Input
                          type="tel"
                          placeholder="+263 77 000 0000"
                          value={fm.phone_number ?? ''}
                          onChange={(e) => updateFamilyMember(index, 'phone_number', e.target.value)}
                          disabled={loading}
                          className="bg-white"
                        />
                      </div>

                      {/* Email (optional) */}
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Email (Optional)</Label>
                        <Input
                          type="email"
                          placeholder="jane@example.com"
                          value={fm.email ?? ''}
                          onChange={(e) => updateFamilyMember(index, 'email', e.target.value)}
                          disabled={loading}
                          className="bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
            )}

            <Button
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              disabled={loading || phoneCheckStatus === 'exists' || phoneCheckStatus === 'checking'}
            >
              {loading
                ? 'Registering...'
                : registrationType === 'family'
                ? `Register Family (${1 + familyMembers.filter((fm) => fm.full_name.trim()).length})`
                : 'Register'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
