'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { registerMember, updateMember, checkPhoneExists, registerFamilyGroup } from '@/lib/actions/members'
import type { FamilyMemberInput } from '@/lib/actions/members'
import type { Member, Branch } from '@/lib/types/database.types'
import { maskPhoneNumber } from '@/lib/utils/helpers'

const emptyFamilyMember = (): FamilyMemberInput => ({
  full_name: '',
  gender: 'Male',
  date_of_birth: '',
  family_role: 'child',
  phone_number: '',
  email: '',
  baptism_year: null,
})

interface MemberFormProps {
  member: Member | null
  branches: Branch[]
  onSuccess: () => void
  onCancel: () => void
}

export default function MemberForm({ member, branches, onSuccess, onCancel }: MemberFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneCheckStatus, setPhoneCheckStatus] = useState<'idle' | 'checking' | 'exists' | 'available'>('idle')
  const [existingMember, setExistingMember] = useState<any>(null)
  // Family members (only used when creating a new member, not editing)
  const [showFamilySection, setShowFamilySection] = useState(false)
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberInput[]>([emptyFamilyMember()])

  const [formData, setFormData] = useState({
    full_name: member?.full_name || '',
    gender: member?.gender || '',
    date_of_birth: member?.date_of_birth || '',
    phone_number: member?.phone_number || '',
    baptism_year: member?.baptism_year?.toString() || '',
    home_address: member?.home_address || '',
    branch_id: member?.branch_id || '',
    email: member?.email || '',
  })

  useEffect(() => {
    if (member) {
      setFormData({
        full_name: member.full_name,
        gender: member.gender,
        date_of_birth: member.date_of_birth,
        phone_number: member.phone_number ?? '',
        baptism_year: member.baptism_year?.toString() || '',
        home_address: member.home_address,
        branch_id: member.branch_id,
        email: member.email || '',
      })
    }
  }, [member])

  const handlePhoneCheck = async (phone: string) => {
    // Skip check if editing the same member
    if (member && phone === member.phone_number) {
      setPhoneCheckStatus('idle')
      return
    }

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

    if (!member && phoneCheckStatus === 'exists') {
      setError('This phone number is already registered')
      return
    }

    setLoading(true)

    try {
      const memberData = {
        full_name: formData.full_name,
        gender: formData.gender as 'Male' | 'Female',
        date_of_birth: formData.date_of_birth,
        phone_number: formData.phone_number,
        baptism_year: formData.baptism_year ? parseInt(formData.baptism_year) : null,
        home_address: formData.home_address,
        branch_id: formData.branch_id,
        email: formData.email || null,
      }

      let result
      if (member) {
        result = await updateMember(member.id, memberData)
      } else if (showFamilySection && familyMembers.some((fm) => fm.full_name.trim())) {
        // Family group registration
        const validMembers = familyMembers.filter((fm) => fm.full_name.trim())
        result = await registerFamilyGroup(
          {
            ...memberData,
            registration_source: 'admin',
            is_verified: true,
            verified_at: new Date().toISOString(),
          },
          validMembers.map((fm) => ({ ...fm, phone_number: fm.phone_number || null, email: fm.email || null }))
        )
      } else {
        result = await registerMember({
          ...memberData,
          registration_source: 'admin',
          is_verified: true,
          verified_at: new Date().toISOString(),
        })
      }

      if (result.error) {
        setError(result.error)
      } else {
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            if (!member) {
              handlePhoneCheck(e.target.value)
            }
          }}
          required
          disabled={loading}
        />
        {!member && phoneCheckStatus === 'checking' && (
          <p className="text-sm text-gray-500">Checking availability...</p>
        )}
        {!member && phoneCheckStatus === 'exists' && existingMember && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            Already registered to {existingMember.full_name}
          </div>
        )}
        {!member && phoneCheckStatus === 'available' && (
          <p className="text-sm text-green-600">✓ Available</p>
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

      <div className="grid grid-cols-2 gap-4">
        {/* Branch */}
        <div className="space-y-2">
          <Label htmlFor="branch_id">
            Branch <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.branch_id}
            onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
            disabled={loading}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Baptism Year */}
        <div className="space-y-2">
          <Label htmlFor="baptism_year">Baptism Year</Label>
          <Input
            id="baptism_year"
            type="number"
            placeholder="2020"
            min="1900"
            max={new Date().getFullYear()}
            value={formData.baptism_year}
            onChange={(e) => setFormData({ ...formData, baptism_year: e.target.value })}
            disabled={loading}
          />
        </div>
      </div>

      {/* Home Address */}
      <div className="space-y-2">
        <Label htmlFor="home_address">
          Home Address <span className="text-red-500">*</span>
        </Label>
        <Input
          id="home_address"
          type="text"
          value={formData.home_address}
          onChange={(e) => setFormData({ ...formData, home_address: e.target.value })}
          required
          disabled={loading}
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email (Optional)</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={loading}
        />
      </div>

      {/* Family members section — only available when adding a new member */}
      {!member && (
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setShowFamilySection((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            disabled={loading}
          >
            <Users className="h-4 w-4" />
            {showFamilySection ? 'Hide family members' : 'Also register family members'}
          </button>

          {showFamilySection && (
            <div className="space-y-4">
              {familyMembers.map((fm, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Member {index + 1}</p>
                    {familyMembers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setFamilyMembers((prev) => prev.filter((_, i) => i !== index))}
                        className="text-red-400 hover:text-red-600"
                        disabled={loading}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <Label className="text-xs text-gray-500">Relationship</Label>
                      <Select
                        value={fm.family_role}
                        onValueChange={(v) =>
                          setFamilyMembers((prev) =>
                            prev.map((m, i) => (i === index ? { ...m, family_role: v as any } : m))
                          )
                        }
                        disabled={loading}
                      >
                        <SelectTrigger className="mt-1 bg-white">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-gray-500">Full Name</Label>
                      <Input
                        type="text"
                        placeholder="Jane Doe"
                        value={fm.full_name}
                        onChange={(e) =>
                          setFamilyMembers((prev) =>
                            prev.map((m, i) => (i === index ? { ...m, full_name: e.target.value } : m))
                          )
                        }
                        required
                        disabled={loading}
                        className="mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Gender</Label>
                      <Select
                        value={fm.gender}
                        onValueChange={(v) =>
                          setFamilyMembers((prev) =>
                            prev.map((m, i) => (i === index ? { ...m, gender: v as any } : m))
                          )
                        }
                        disabled={loading}
                      >
                        <SelectTrigger className="mt-1 bg-white">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Date of Birth</Label>
                      <Input
                        type="date"
                        value={fm.date_of_birth}
                        onChange={(e) =>
                          setFamilyMembers((prev) =>
                            prev.map((m, i) => (i === index ? { ...m, date_of_birth: e.target.value } : m))
                          )
                        }
                        required
                        disabled={loading}
                        max={new Date().toISOString().split('T')[0]}
                        className="mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Phone (Optional)</Label>
                      <Input
                        type="tel"
                        placeholder="+263 77..."
                        value={fm.phone_number ?? ''}
                        onChange={(e) =>
                          setFamilyMembers((prev) =>
                            prev.map((m, i) => (i === index ? { ...m, phone_number: e.target.value } : m))
                          )
                        }
                        disabled={loading}
                        className="mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Email (Optional)</Label>
                      <Input
                        type="email"
                        placeholder="jane@example.com"
                        value={fm.email ?? ''}
                        onChange={(e) =>
                          setFamilyMembers((prev) =>
                            prev.map((m, i) => (i === index ? { ...m, email: e.target.value } : m))
                          )
                        }
                        disabled={loading}
                        className="mt-1 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFamilyMembers((prev) => [...prev, emptyFamilyMember()])}
                disabled={loading}
                className="gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Another
              </Button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || (!member && phoneCheckStatus === 'exists')}
        >
          {loading ? 'Saving...' : member ? 'Update Member' : 'Add Member'}
        </Button>
      </div>
    </form>
  )
}
