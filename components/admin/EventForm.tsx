'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createEvent } from '@/lib/actions/events'
import type { Branch } from '@/lib/types/database.types'

interface EventFormProps {
  branches: Branch[]
  lockedBranchId?: string | null
  onSuccess: () => void
  onCancel: () => void
}

export default function EventForm({ branches, lockedBranchId, onSuccess, onCancel }: EventFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    branch_id: lockedBranchId ?? '',
    event_date: '',
    event_time: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Combine date and time
      const eventDateTime = `${formData.event_date}T${formData.event_time}:00`

      const result = await createEvent({
        title: formData.title,
        description: formData.description || null,
        branch_id: formData.branch_id,
        event_date: eventDateTime,
        is_active: true,
      })

      if (result.error) {
        setError(result.error)
      } else {
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Event Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Event Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          type="text"
          placeholder="Sunday Main Service"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          disabled={loading}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          type="text"
          placeholder="Weekly worship service"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          disabled={loading}
        />
      </div>

      {/* Branch */}
      <div className="space-y-2">
        <Label htmlFor="branch_id">
          Branch <span className="text-red-500">*</span>
        </Label>
        {lockedBranchId ? (
          <div className="px-3 py-2 border rounded-md bg-gray-50 text-sm text-gray-700">
            {branches.find((b) => b.id === lockedBranchId)?.name ?? 'Your Branch'}
            <span className="text-xs text-gray-400 ml-2">(locked to your branch)</span>
          </div>
        ) : (
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
                {branch.name} - {branch.location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        )}
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event_date">
            Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="event_date"
            type="date"
            value={formData.event_date}
            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event_time">
            Time <span className="text-red-500">*</span>
          </Label>
          <Input
            id="event_time"
            type="time"
            value={formData.event_time}
            onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
            required
            disabled={loading}
          />
        </div>
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
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Event'}
        </Button>
      </div>
    </form>
  )
}
