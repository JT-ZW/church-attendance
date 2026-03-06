'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw, FileText } from 'lucide-react'
import { getAttendanceByEvent } from '@/lib/actions/attendance'
import { formatDate } from '@/lib/utils/helpers'
import { exportAttendancePDF } from '@/lib/utils/pdf-export'
import type { AttendanceWithDetails } from '@/lib/types/database.types'

interface Props {
  eventId: string
  initialAttendance: AttendanceWithDetails[]
  eventTitle?: string
  eventDate?: string
  branchName?: string
}

export default function EventAttendanceList({ eventId, initialAttendance, eventTitle = 'Event', eventDate = new Date().toISOString(), branchName = '' }: Props) {
  const [attendance, setAttendance] = useState<AttendanceWithDetails[]>(initialAttendance)
  const [loading, setLoading] = useState(false)

  async function refreshAttendance() {
    setLoading(true)
    try {
      const data = await getAttendanceByEvent(eventId)
      setAttendance(data)
    } catch (error) {
      console.error('Failed to refresh attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAttendance()
    }, 30000)

    return () => clearInterval(interval)
  }, [eventId])

  function handlePDFExport() {
    exportAttendancePDF(attendance, eventTitle, eventDate, branchName)
  }

  function exportToCSV() {
    const csvData = [
      ['Name', 'Gender', 'Age', 'Phone', 'Branch', 'Check-in Time'],
      ...attendance.map((record) => [
        record.members?.full_name || 'Unknown',
        record.members?.gender || 'N/A',
        record.members?.date_of_birth
          ? Math.floor(
              (Date.now() - new Date(record.members.date_of_birth).getTime()) /
                (1000 * 60 * 60 * 24 * 365)
            )
          : 'N/A',
        record.members?.phone_number || 'N/A',
        record.members?.branches?.name || 'N/A',
        new Date(record.checked_in_at).toLocaleString(),
      ]),
    ]

    const csv = csvData.map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `event-attendance-${eventId}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-heading">Attendance List</CardTitle>
            <CardDescription>
              Real-time list of checked-in members ({attendance.length} total)
            </CardDescription>
          </div>
          <div className="flex gap-2">
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
              disabled={attendance.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={attendance.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {attendance.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No attendance records yet
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Check-in Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.members?.full_name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.members?.gender || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>{record.members?.phone_number || 'N/A'}</TableCell>
                    <TableCell>{record.members?.branches?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(record.checked_in_at).toLocaleTimeString('en-US', {
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
  )
}
