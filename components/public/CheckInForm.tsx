'use client'

import { useState, useEffect } from 'react'
import { Search, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { searchMembers } from '@/lib/actions/members'
import { checkIn } from '@/lib/actions/attendance'
import { calculateAge, maskPhoneNumber } from '@/lib/utils/helpers'
import type { Event } from '@/lib/types/database.types'

interface CheckInFormProps {
  event: Event & {
    branches?: {
      id: string
      name: string
      location: string
    }
  }
}

interface MemberSearchResult {
  id: string
  full_name: string
  phone_number: string
  date_of_birth: string
  gender: string
  branch_id: string
}

export default function CheckInForm({ event }: CheckInFormProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<MemberSearchResult[]>([])
  const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.length >= 2) {
        handleSearch()
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [searchTerm])

  async function handleSearch() {
    setSearching(true)
    try {
      const results = await searchMembers(searchTerm, event.branch_id)
      setSearchResults(results)
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setSearching(false)
    }
  }

  function handleSelectMember(member: MemberSearchResult) {
    setSelectedMember(member)
    setSearchResults([])
    setSearchTerm(member.full_name)
  }

  async function handleCheckIn() {
    if (!selectedMember) return

    setLoading(true)
    setError(null)

    try {
      const result = await checkIn(selectedMember.id, event.id)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        // Reset after 3 seconds
        setTimeout(() => {
          setSuccess(false)
          setSelectedMember(null)
          setSearchTerm('')
        }, 3000)
      }
    } catch (err: any) {
      setError(err.message || 'Check-in failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-green-600">Check-in Successful!</h3>
          <p className="text-gray-600 mt-2">
            Welcome, {selectedMember?.full_name}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Your attendance has been recorded
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search your name..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setSelectedMember(null)
          }}
          className="pl-10 text-lg py-6"
          disabled={loading}
        />
        {searching && (
          <div className="absolute right-3 top-3 text-sm text-gray-500">
            Searching...
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {searchResults.length > 0 && !selectedMember && (
        <div className="border rounded-lg bg-white shadow-lg max-h-64 overflow-y-auto">
          {searchResults.map((member) => (
            <button
              key={member.id}
              onClick={() => handleSelectMember(member)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
            >
              <p className="font-medium">{member.full_name}</p>
              <div className="flex gap-3 text-sm text-gray-600 mt-1">
                <span>{maskPhoneNumber(member.phone_number)}</span>
                <span>•</span>
                <span>{member.gender}</span>
                <span>•</span>
                <span>{calculateAge(member.date_of_birth)} years</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {searchTerm.length >= 2 && searchResults.length === 0 && !searching && !selectedMember && (
        <div className="text-center py-4 text-gray-500">
          <p>No members found</p>
          <p className="text-sm mt-1">
            Try a different name or{' '}
            <a href="/register" className="text-blue-600 hover:underline">
              register here
            </a>
          </p>
        </div>
      )}

      {/* Selected Member Confirmation */}
      {selectedMember && (
        <div className="border rounded-lg p-4 bg-gray-50 border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Checking in as:</p>
          <p className="font-semibold text-lg">{selectedMember.full_name}</p>
          <div className="flex gap-3 text-sm text-gray-600 mt-1">
            <span>{maskPhoneNumber(selectedMember.phone_number)}</span>
            <span>•</span>
            <span>{selectedMember.gender}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      {/* Check-in Button */}
      <Button
        onClick={handleCheckIn}
        disabled={!selectedMember || loading}
        className="w-full py-6 text-lg bg-gray-900 hover:bg-gray-800 text-white"
      >
        {loading ? 'Checking in...' : 'Confirm Check-in'}
      </Button>

      {/* Helper Text */}
      <p className="text-xs text-center text-gray-500">
        Can't find your name?{' '}
        <a href="/register" className="text-gray-900 hover:underline font-medium">
          Register here
        </a>
      </p>
    </div>
  )
}
