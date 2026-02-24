'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { registerMember, updateMember, checkPhoneExists } from '@/lib/actions/members'
import type { Member, Branch } from '@/lib/types/database.types'
import { maskPhoneNumber } from '@/lib/utils/helpers'

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
        phone_number: member.phone_number,
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
