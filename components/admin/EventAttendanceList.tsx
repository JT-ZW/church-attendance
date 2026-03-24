'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Download, RefreshCw, FileText, UserPlus, Eye, Pencil, Trash2 } from 'lucide-react'
import {
  addGuestAttendance,
  deleteGuestAttendanceRecord,
  deleteMemberAttendanceRecord,
  getAttendanceByEvent,
  getGuestAttendanceByEvent,
  updateGuestProfile,
} from '@/lib/actions/attendance'
import { exportAttendancePDF } from '@/lib/utils/pdf-export'
import type { AttendanceWithDetails, GuestAttendanceWithDetails } from '@/lib/types/database.types'
import Link from 'next/link'

interface Props {
  eventId: string
  initialAttendance: AttendanceWithDetails[]
  initialGuestAttendance: GuestAttendanceWithDetails[]
  eventTitle?: string
  eventDate?: string
  branchName?: string
}

type CombinedAttendanceRow = {
  id: string
  type: 'Member' | 'Guest'
  member_id: string | null
  guest_id: string | null
  full_name: string
  gender: 'Male' | 'Female' | 'N/A'
  age: number | null
  phone_number: string | null
  branch_name: string | null
  checked_in_at: string
}

function calculateAge(dateOfBirth: string | null | undefined) {
  if (!dateOfBirth) return null
  return Math.floor(
    (Date.now() - new Date(dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)
  )
}

function formatCsvCell(value: string | number | null) {
  if (value === null || value === undefined) return '""'
  const text = String(value).replaceAll('"', '""')
  return `"${text}"`
}

export default function EventAttendanceList({
  eventId,
  initialAttendance,
  initialGuestAttendance,
  eventTitle = 'Event',
  eventDate = new Date().toISOString(),
  branchName = '',
}: Props) {
  const [attendance, setAttendance] = useState<AttendanceWithDetails[]>(initialAttendance)
  const [guestAttendance, setGuestAttendance] = useState<GuestAttendanceWithDetails[]>(initialGuestAttendance)
  const [loading, setLoading] = useState(false)
  const [submittingGuest, setSubmittingGuest] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const [guestForm, setGuestForm] = useState({
    full_name: '',
    gender: 'Male' as 'Male' | 'Female',
    phone_number: '',
  })

  const [typeFilter, setTypeFilter] = useState<'all' | 'member' | 'guest'>('all')
  const [genderFilter, setGenderFilter] = useState<'all' | 'Male' | 'Female'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [exportScope, setExportScope] = useState<'combined' | 'members' | 'guests'>('combined')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [tableError, setTableError] = useState<string | null>(null)
  const [tableSuccess, setTableSuccess] = useState<string | null>(null)

  const [viewRow, setViewRow] = useState<CombinedAttendanceRow | null>(null)
  const [deleteRow, setDeleteRow] = useState<CombinedAttendanceRow | null>(null)
  const [editGuestRow, setEditGuestRow] = useState<CombinedAttendanceRow | null>(null)
  const [editGuestForm, setEditGuestForm] = useState({
    full_name: '',
    gender: 'Male' as 'Male' | 'Female',
    phone_number: '',
  })

  async function refreshAttendance() {
    setLoading(true)
    try {
      const [memberData, guestData] = await Promise.all([
        getAttendanceByEvent(eventId),
        getGuestAttendanceByEvent(eventId),
      ])
      setAttendance(memberData)
      setGuestAttendance(guestData)
    } catch (error) {
      console.error('Failed to refresh attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddGuest(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)
    setSubmittingGuest(true)

    try {
      const result = await addGuestAttendance(eventId, {
        full_name: guestForm.full_name,
        gender: guestForm.gender,
        phone_number: guestForm.phone_number || null,
      })

      if (result.error) {
        setFormError(result.error)
        return
      }

      setFormSuccess('Guest attendance added successfully')
      setGuestForm({
        full_name: '',
        gender: 'Male',
        phone_number: '',
      })
      await refreshAttendance()
    } finally {
      setSubmittingGuest(false)
    }
  }

  function startEditGuest(row: CombinedAttendanceRow) {
    if (row.type !== 'Guest') return

    setTableError(null)
    setTableSuccess(null)
    setEditGuestRow(row)
    setEditGuestForm({
      full_name: row.full_name,
      gender: row.gender === 'Female' ? 'Female' : 'Male',
      phone_number: row.phone_number || '',
    })
  }

  async function handleSaveGuestEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editGuestRow?.guest_id) return

    setActionLoadingId(editGuestRow.id)
    setTableError(null)
    setTableSuccess(null)

    try {
      const result = await updateGuestProfile(eventId, editGuestRow.guest_id, {
        full_name: editGuestForm.full_name,
        gender: editGuestForm.gender,
        phone_number: editGuestForm.phone_number || null,
      })

      if (result.error) {
        setTableError(result.error)
        return
      }

      setEditGuestRow(null)
      setTableSuccess('Guest details updated successfully')
      await refreshAttendance()
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleConfirmDelete() {
    if (!deleteRow) return

    setActionLoadingId(deleteRow.id)
    setTableError(null)
    setTableSuccess(null)

    try {
      const result =
        deleteRow.type === 'Member'
          ? await deleteMemberAttendanceRecord(eventId, deleteRow.id)
          : await deleteGuestAttendanceRecord(eventId, deleteRow.id)

      if (result.error) {
        setTableError(result.error)
        return
      }

      setDeleteRow(null)
      setTableSuccess(`${deleteRow.type} attendance record deleted successfully`)
      await refreshAttendance()
    } finally {
      setActionLoadingId(null)
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      refreshAttendance()
    }, 30000)

    return () => clearInterval(interval)
  }, [eventId])

  const memberRows = useMemo<CombinedAttendanceRow[]>(() => {
    return attendance.map((record) => ({
      id: record.id,
      type: 'Member',
      member_id: record.members?.id || null,
      guest_id: null,
      full_name: record.members?.full_name || 'Unknown',
      gender: record.members?.gender || 'N/A',
      age: calculateAge(record.members?.date_of_birth),
      phone_number: record.members?.phone_number || null,
      branch_name: record.members?.branches?.name || null,
      checked_in_at: record.checked_in_at,
    }))
  }, [attendance])

  const guestRows = useMemo<CombinedAttendanceRow[]>(() => {
    return guestAttendance.map((record) => ({
      id: record.id,
      type: 'Guest',
      member_id: null,
      guest_id: record.guests?.id || null,
      full_name: record.guests?.full_name || 'Unknown',
      gender: record.guests?.gender || 'N/A',
      age: null,
      phone_number: record.guests?.phone_number || null,
      branch_name: branchName || null,
      checked_in_at: record.checked_in_at,
    }))
  }, [guestAttendance, branchName])

  const combinedRows = useMemo<CombinedAttendanceRow[]>(() => {
    return [...memberRows, ...guestRows].sort((a, b) => {
      return new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime()
    })
  }, [memberRows, guestRows])

  const filteredCombinedRows = useMemo(() => {
    return combinedRows.filter((row) => {
      if (typeFilter === 'member' && row.type !== 'Member') return false
      if (typeFilter === 'guest' && row.type !== 'Guest') return false
      if (genderFilter !== 'all' && row.gender !== genderFilter) return false

      const term = searchTerm.trim().toLowerCase()
      if (!term) return true

      return (
        row.full_name.toLowerCase().includes(term) ||
        (row.phone_number || '').toLowerCase().includes(term)
      )
    })
  }, [combinedRows, genderFilter, searchTerm, typeFilter])

  const scopedExportRows = useMemo(() => {
    const rowsByScope =
      exportScope === 'members'
        ? memberRows
        : exportScope === 'guests'
          ? guestRows
          : filteredCombinedRows

    return rowsByScope.filter((row) => {
      if (genderFilter !== 'all' && row.gender !== genderFilter) return false

      const term = searchTerm.trim().toLowerCase()
      if (!term) return true

      return (
        row.full_name.toLowerCase().includes(term) ||
        (row.phone_number || '').toLowerCase().includes(term)
      )
    })
  }, [exportScope, filteredCombinedRows, genderFilter, guestRows, memberRows, searchTerm])

  function handlePDFExport() {
    exportAttendancePDF(scopedExportRows, eventTitle, eventDate, branchName, { scope: exportScope })
  }

  function exportToCSV() {
    const csvData = [
      ['Type', 'Name', 'Gender', 'Age', 'Phone', 'Branch', 'Check-in Time'],
      ...scopedExportRows.map((row) => [
        row.type,
        row.full_name,
        row.gender,
        row.age ?? 'N/A',
        row.phone_number || 'N/A',
        row.branch_name || 'N/A',
        new Date(row.checked_in_at).toLocaleString(),
      ]),
    ]

    const csv = csvData
      .map((row) => row.map((value) => formatCsvCell(value as string | number | null)).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `event-attendance-${eventId}-${new Date().toISOString().split('T')[0]}-${exportScope}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Add Guest Attendance</CardTitle>
          <CardDescription>Add a guest to this event and reuse the guest profile for future visits</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddGuest} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="guest-full-name">Full Name</Label>
                <Input
                  id="guest-full-name"
                  value={guestForm.full_name}
                  onChange={(e) => setGuestForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Guest full name"
                  required
                  disabled={submittingGuest}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest-gender">Gender</Label>
                <Select
                  value={guestForm.gender}
                  onValueChange={(value: 'Male' | 'Female') => setGuestForm((prev) => ({ ...prev, gender: value }))}
                  disabled={submittingGuest}
                >
                  <SelectTrigger id="guest-gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest-phone-number">Phone Number (Optional)</Label>
                <Input
                  id="guest-phone-number"
                  value={guestForm.phone_number}
                  onChange={(e) => setGuestForm((prev) => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="+263 77 123 4567"
                  disabled={submittingGuest}
                />
              </div>
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}
            {formSuccess && <p className="text-sm text-green-600">{formSuccess}</p>}

            <Button type="submit" disabled={submittingGuest}>
              <UserPlus className="h-4 w-4 mr-2" />
              {submittingGuest ? 'Adding...' : 'Add Guest Attendance'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="font-heading">Combined Attendance List</CardTitle>
              <CardDescription>
                Members and guests combined ({filteredCombinedRows.length} shown / {combinedRows.length} total)
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshAttendance}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePDFExport}
                disabled={scopedExportRows.length === 0}
              >
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={scopedExportRows.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-1">
              <Label>Type Filter</Label>
              <Select value={typeFilter} onValueChange={(value: 'all' | 'member' | 'guest') => setTypeFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="member">Members</SelectItem>
                  <SelectItem value="guest">Guests</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Gender Filter</Label>
              <Select value={genderFilter} onValueChange={(value: 'all' | 'Male' | 'Female') => setGenderFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label>Search</Label>
              <Input
                placeholder="Search by name or phone"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Export Scope</Label>
              <Select value={exportScope} onValueChange={(value: 'combined' | 'members' | 'guests') => setExportScope(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="combined">Combined (Filtered)</SelectItem>
                  <SelectItem value="members">Members Only</SelectItem>
                  <SelectItem value="guests">Guests Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {tableError && <p className="text-sm text-red-600">{tableError}</p>}
          {tableSuccess && <p className="text-sm text-green-600">{tableSuccess}</p>}

          {filteredCombinedRows.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No attendance records match the selected filters
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Check-in Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCombinedRows.map((row) => (
                    <TableRow key={`${row.type}-${row.id}`}>
                      <TableCell>
                        <Badge variant={row.type === 'Guest' ? 'secondary' : 'outline'}>{row.type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{row.full_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.gender}</Badge>
                      </TableCell>
                      <TableCell>{row.phone_number || 'N/A'}</TableCell>
                      <TableCell>{row.branch_name || 'N/A'}</TableCell>
                      <TableCell>
                        {new Date(row.checked_in_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTableError(null)
                              setTableSuccess(null)
                              setViewRow(row)
                            }}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>

                          {row.type === 'Guest' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditGuest(row)}
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoadingId === row.id}
                            onClick={() => {
                              setTableError(null)
                              setTableSuccess(null)
                              setDeleteRow(row)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Members Attendance</CardTitle>
            <CardDescription>{memberRows.length} checked-in members</CardDescription>
          </CardHeader>
          <CardContent>
            {memberRows.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No member attendance records yet</div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Check-in Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.full_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.gender}</Badge>
                        </TableCell>
                        <TableCell>{row.phone_number || 'N/A'}</TableCell>
                        <TableCell>
                          {new Date(row.checked_in_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Guests Attendance</CardTitle>
            <CardDescription>{guestRows.length} checked-in guests</CardDescription>
          </CardHeader>
          <CardContent>
            {guestRows.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No guest attendance records yet</div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Check-in Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guestRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.full_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.gender}</Badge>
                        </TableCell>
                        <TableCell>{row.phone_number || 'N/A'}</TableCell>
                        <TableCell>
                          {new Date(row.checked_in_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!viewRow} onOpenChange={(open) => !open && setViewRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewRow?.type} Attendance Details</DialogTitle>
            <DialogDescription>
              Record details for this event check-in.
            </DialogDescription>
          </DialogHeader>

          {viewRow && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Type</span>
                <span className="font-medium">{viewRow.type}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Full Name</span>
                <span className="font-medium">{viewRow.full_name}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Gender</span>
                <span className="font-medium">{viewRow.gender}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium">{viewRow.phone_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Branch</span>
                <span className="font-medium">{viewRow.branch_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Checked In At</span>
                <span className="font-medium">{new Date(viewRow.checked_in_at).toLocaleString()}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            {viewRow?.type === 'Member' && viewRow.member_id ? (
              <Button asChild variant="outline">
                <Link href={`/members/${viewRow.member_id}`}>Open Member Profile</Link>
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setViewRow(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editGuestRow} onOpenChange={(open) => !open && setEditGuestRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Guest Details</DialogTitle>
            <DialogDescription>
              Update this guest profile. Changes apply anywhere this guest appears.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveGuestEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-guest-full-name">Full Name</Label>
              <Input
                id="edit-guest-full-name"
                value={editGuestForm.full_name}
                onChange={(e) => setEditGuestForm((prev) => ({ ...prev, full_name: e.target.value }))}
                required
                disabled={actionLoadingId === editGuestRow?.id}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-guest-gender">Gender</Label>
              <Select
                value={editGuestForm.gender}
                onValueChange={(value: 'Male' | 'Female') => setEditGuestForm((prev) => ({ ...prev, gender: value }))}
                disabled={actionLoadingId === editGuestRow?.id}
              >
                <SelectTrigger id="edit-guest-gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-guest-phone">Phone Number (Optional)</Label>
              <Input
                id="edit-guest-phone"
                value={editGuestForm.phone_number}
                onChange={(e) => setEditGuestForm((prev) => ({ ...prev, phone_number: e.target.value }))}
                disabled={actionLoadingId === editGuestRow?.id}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditGuestRow(null)}
                disabled={actionLoadingId === editGuestRow?.id}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoadingId === editGuestRow?.id}>
                {actionLoadingId === editGuestRow?.id ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteRow} onOpenChange={(open) => !open && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Attendance Record</DialogTitle>
            <DialogDescription>
              This removes this person's check-in from this event only.
            </DialogDescription>
          </DialogHeader>

          <div className="text-sm text-gray-700">
            Are you sure you want to delete the {deleteRow?.type?.toLowerCase()} attendance record for{' '}
            <span className="font-medium">{deleteRow?.full_name}</span>?
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteRow(null)}
              disabled={deleteRow ? actionLoadingId === deleteRow.id : false}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteRow ? actionLoadingId === deleteRow.id : false}
            >
              {deleteRow && actionLoadingId === deleteRow.id ? 'Deleting...' : 'Delete Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
