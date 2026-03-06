'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Download, FileText, TrendingUp, Users, Calendar, BarChart3 } from 'lucide-react'
import { getBranches } from '@/lib/actions/branches'
import {
  getAnalyticsSummary,
  getAgeDistribution,
  getAttendanceTrends,
  getTopAttendees,
  getAttendanceRate,
} from '@/lib/actions/analytics'
import type { Branch } from '@/lib/types/database.types'
import { exportAnalyticsPDF } from '@/lib/utils/pdf-export'
import AgeDistributionChart from './AgeDistributionChart'
import AttendanceTrendChart from './AttendanceTrendChart'
import GenderBreakdownChart from './GenderBreakdownChart'
import TopAttendeesList from './TopAttendeesList'
import { useAdminContext } from '@/components/admin/AdminProvider'

export default function AnalyticsDashboard() {
  const { branchId, isBranchAdmin } = useAdminContext()
  const [branches, setBranches] = useState<Branch[]>([])
  // Branch admins are locked to their branch; super admins default to 'all'
  const [selectedBranch, setSelectedBranch] = useState<string>(branchId ?? 'all')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    loadBranches()
  }, [])

  // When context branchId changes (navigation), sync the selector
  useEffect(() => {
    if (isBranchAdmin && branchId) {
      setSelectedBranch(branchId)
    }
  }, [branchId, isBranchAdmin])

  useEffect(() => {
    if (branches.length > 0) {
      loadAnalytics()
    }
  }, [selectedBranch, branches])

  async function loadBranches() {
    try {
      const branchesData = await getBranches()
      setBranches(branchesData)
    } catch (error) {
      console.error('Failed to load branches:', error)
    }
  }

  async function loadAnalytics() {
    setLoading(true)
    try {
      const branchId = selectedBranch === 'all' ? undefined : selectedBranch

      const [summary, ageDistribution, trends, topAttendees, attendanceRate] = await Promise.all([
        getAnalyticsSummary(branchId),
        getAgeDistribution(branchId),
        getAttendanceTrends(branchId, 90),
        getTopAttendees(branchId, 10),
        getAttendanceRate(branchId),
      ])

      setData({
        summary,
        ageDistribution,
        trends,
        topAttendees,
        attendanceRate,
      })
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  function getBranchName() {
    return selectedBranch === 'all'
      ? 'All Branches'
      : branches.find(b => b.id === selectedBranch)?.name || 'Unknown'
  }

  function handlePDFExport() {
    if (!data) return
    exportAnalyticsPDF(data, getBranchName())
  }

  async function handleExport() {
    if (!data) return

    const branchName = getBranchName()

    // Prepare CSV data
    const csvData = [
      ['Church Analytics Report'],
      ['Generated:', new Date().toLocaleString()],
      ['Branch:', branchName],
      [''],
      ['Summary Statistics'],
      ['Total Members', data.summary.totalMembers],
      ['Total Events', data.summary.totalEvents],
      ['Total Attendance', data.summary.totalAttendance],
      ['Average Attendance', data.summary.avgAttendance],
      ['Average Attendance Rate', `${data.attendanceRate}%`],
      ['Male Members', data.summary.maleCount],
      ['Female Members', data.summary.femaleCount],
      ['Admin Registered', data.summary.adminRegistered],
      ['Self Registered', data.summary.selfRegistered],
      [''],
      ['Age Distribution'],
      ['Age Group', 'Total', 'Male', 'Female'],
      ...data.ageDistribution.map((row: any) => [row.name, row.total, row.male, row.female]),
      [''],
      ['Top Attendees'],
      ['Name', 'Phone', 'Events Attended'],
      ...data.topAttendees.map((row: any) => [row.name, row.phone, row.attendanceCount]),
    ]

    // Convert to CSV string
    const csv = csvData.map(row => row.join(',')).join('\n')

    // Download
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `church-analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>
  }

  if (!data) {
    return <div className="text-center py-8 text-gray-500">No data available</div>
  }

  return (
    <div className="space-y-6">
      {/* Filters and Export */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Branch:</label>
          {isBranchAdmin ? (
            <div className="px-3 py-2 border rounded-md bg-gray-50 text-sm text-gray-700 w-48">
              {branches.find(b => b.id === branchId)?.name ?? 'Your Branch'}
            </div>
          ) : (
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePDFExport} variant="outline" disabled={!data}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={handleExport} variant="outline" disabled={!data}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Members
            </CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalMembers}</div>
            <p className="text-xs text-gray-500 mt-1">
              {data.summary.maleCount} male, {data.summary.femaleCount} female
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg Attendance
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.avgAttendance}</div>
            <p className="text-xs text-gray-500 mt-1">
              per event
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Events
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalEvents}</div>
            <p className="text-xs text-gray-500 mt-1">
              all time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Attendance Rate
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.attendanceRate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              average of last 20 events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Gender Distribution</CardTitle>
            <CardDescription>
              Member demographics by gender
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GenderBreakdownChart 
              maleCount={data.summary.maleCount}
              femaleCount={data.summary.femaleCount}
            />
          </CardContent>
        </Card>

        {/* Top Attendees */}
        <TopAttendeesList attendees={data.topAttendees} />
      </div>

      {/* Charts Row 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Age Distribution</CardTitle>
          <CardDescription>
            Member age groups by gender
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgeDistributionChart data={data.ageDistribution} />
        </CardContent>
      </Card>

      {/* Charts Row 3 */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Attendance Trends</CardTitle>
          <CardDescription>
            Event attendance over the last 90 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.trends.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No events in the last 90 days
            </div>
          ) : (
            <AttendanceTrendChart data={data.trends} />
          )}
        </CardContent>
      </Card>

      {/* Registration Source */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Registration Sources</CardTitle>
          <CardDescription>
            How members joined the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Admin Registered</p>
              <p className="text-3xl font-bold text-blue-600">
                {data.summary.adminRegistered}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {data.summary.totalMembers > 0 
                  ? Math.round((data.summary.adminRegistered / data.summary.totalMembers) * 100)
                  : 0}% of total
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Self Registered</p>
              <p className="text-3xl font-bold text-green-600">
                {data.summary.selfRegistered}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {data.summary.totalMembers > 0
                  ? Math.round((data.summary.selfRegistered / data.summary.totalMembers) * 100)
                  : 0}% of total
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
