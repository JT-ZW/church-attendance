'use client'

import { useState, useEffect } from 'react'
import { Search, CheckCircle2, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { searchMembers, getFamilyMembers } from '@/lib/actions/members'
import { familyCheckIn } from '@/lib/actions/attendance'
import { calculateAge, maskPhoneNumber } from '@/lib/utils/helpers'
import type { Event, FamilyMemberCheckIn } from '@/lib/types/database.types'

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
  phone_number: string | null
  date_of_birth: string
  gender: string
  branch_id: string
  branches: { name: string }[] | null
}

export default function CheckInForm({ event }: CheckInFormProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<MemberSearchResult[]>([])
  const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [searching, setSearching] = useState(false)
  // Family check-in state
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberCheckIn[]>([])
  const [selectedFamilyIds, setSelectedFamilyIds] = useState<Set<string>>(new Set())
  const [loadingFamily, setLoadingFamily] = useState(false)
  const [checkInResult, setCheckInResult] = useState<{ checkedIn: number; alreadyIn: number } | null>(null)

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
      const results = await searchMembers(searchTerm)
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
    // Reset family state whenever a different person is selected
    setFamilyMembers([])
    setSelectedFamilyIds(new Set())
  }

  // Whenever a member is confirmed selected (search result gone), load their family
  useEffect(() => {
    if (!selectedMember) return
    let cancelled = false
    async function loadFamily() {
      setLoadingFamily(true)
      try {
        const members = await getFamilyMembers(selectedMember!.id, event.id)
        if (!cancelled) {
          setFamilyMembers(members)
          // Pre-select family members who have NOT yet checked in
          const toSelect = new Set(
            members.filter((m) => !m.already_checked_in).map((m) => m.id)
          )
          setSelectedFamilyIds(toSelect)
        }
      } catch {
        // No family or error — silently ignore
      } finally {
        if (!cancelled) setLoadingFamily(false)
      }
    }
    loadFamily()
    return () => { cancelled = true }
  }, [selectedMember, event.id])

  function toggleFamilyMember(id: string) {
    setSelectedFamilyIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleCheckIn() {
    if (!selectedMember) return

    setLoading(true)
    setError(null)

    try {
      // Always include the primary member; add any ticked family members
      const allIds = [selectedMember.id, ...Array.from(selectedFamilyIds)]
      const result = await familyCheckIn(allIds, event.id)

      if (result.error) {
        setError(result.error)
      } else {
        setCheckInResult({
          checkedIn: result.data!.checked_in.length,
          alreadyIn: result.data!.already_checked_in.length,
        })
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          setSelectedMember(null)
          setSearchTerm('')
          setFamilyMembers([])
          setSelectedFamilyIds(new Set())
          setCheckInResult(null)
        }, 4000)
      }
    } catch (err: any) {
      setError(err.message || 'Check-in failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    const total = (checkInResult?.checkedIn ?? 0) + (checkInResult?.alreadyIn ?? 0)
    const newlyIn = checkInResult?.checkedIn ?? 0
    return (
      <div className="text-center space-y-4 py-8">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-green-600">Check-in Successful!</h3>
          {total === 1 ? (
            <p className="text-gray-600 mt-2">Welcome, {selectedMember?.full_name}!</p>
          ) : (
            <>
              <p className="text-gray-600 mt-2">
                Welcome, {selectedMember?.full_name} and family!
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {newlyIn} member{newlyIn !== 1 ? 's' : ''} checked in
                {checkInResult!.alreadyIn > 0 && (
                  <>, {checkInResult!.alreadyIn} already recorded</>  
                )}
              </p>
            </>
          )}
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
                <span>{maskPhoneNumber(member.phone_number ?? '')}</span>
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
            <span>{maskPhoneNumber(selectedMember.phone_number ?? '')}</span>
            <span>•</span>
            <span>{selectedMember.gender}</span>
          </div>
        </div>
      )}

      {/* Cross-branch notice */}
      {selectedMember && selectedMember.branch_id !== event.branch_id && (
        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="mt-0.5 shrink-0 text-base">ℹ️</span>
          <p>
            <span className="font-medium">Not your home branch.</span>{' '}
            You are registered at{' '}
            <span className="font-medium">{selectedMember.branches?.[0]?.name ?? 'another branch'}</span>,
            but this event is hosted by{' '}
            <span className="font-medium">{event.branches?.name ?? 'a different branch'}</span>.
            You can still check in!
          </p>
        </div>
      )}

      {/* Family members section */}
      {selectedMember && loadingFamily && (
        <p className="text-sm text-gray-500">Checking for family members...</p>
      )}
      {selectedMember && !loadingFamily && familyMembers.length > 0 && (
        <div className="border rounded-lg border-gray-200 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
            <Users className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-medium text-gray-700">Also check in family members?</p>
          </div>
          <div className="divide-y divide-gray-100">
            {familyMembers.map((fm) => (
              <label
                key={fm.id}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  fm.already_checked_in ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={fm.already_checked_in || selectedFamilyIds.has(fm.id)}
                  onChange={() => !fm.already_checked_in && toggleFamilyMember(fm.id)}
                  disabled={fm.already_checked_in || loading}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{fm.full_name}</p>
                  <p className="text-xs text-gray-500">
                    {fm.family_role &&
                      fm.family_role.charAt(0).toUpperCase() + fm.family_role.slice(1)}
                    {' · '}
                    {calculateAge(fm.date_of_birth)} yrs
                    {fm.already_checked_in && (
                      <span className="ml-2 text-green-600 font-medium">✓ Already checked in</span>
                    )}
                  </p>
                </div>
              </label>
            ))}
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
