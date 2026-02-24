import { notFound } from 'next/navigation'
import { getMemberById } from '@/lib/actions/members'
import { getMemberAttendanceHistory } from '@/lib/actions/analytics'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, TrendingUp, User, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'
import { calculateAge, formatDate } from '@/lib/utils/helpers'
import { Badge } from '@/components/ui/badge'

interface Props {
  params: Promise<{ id: string }>
}

export default async function MemberDetailPage({ params }: Props) {
  const { id } = await params
  
  try {
    const [member, attendance] = await Promise.all([
      getMemberById(id),
      getMemberAttendanceHistory(id),
    ])

    if (!member) {
      notFound()
    }

    const totalEvents = attendance.length
    const lastAttended = attendance[0]?.events?.event_date
      ? new Date(attendance[0].events.event_date)
      : null
    const age = calculateAge(member.date_of_birth)

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/members">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-heading">{member.full_name}</h1>
            <p className="text-gray-600 mt-1">Member Details & Attendance History</p>
          </div>
        </div>

        {/* Member Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Events
              </CardTitle>
              <Calendar className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEvents}</div>
              <p className="text-xs text-gray-500 mt-1">
                events attended
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Last Attended
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {lastAttended ? formatDate(lastAttended.toISOString()) : 'Never'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                most recent
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Member Age
              </CardTitle>
              <User className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{age} years</div>
              <p className="text-xs text-gray-500 mt-1">
                {member.gender}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Personal Information</CardTitle>
            <CardDescription>Member details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{member.full_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium">{member.phone_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium">{formatDate(member.date_of_birth)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Baptism Year</p>
                  <p className="font-medium">{member.baptism_year ?? 'Not recorded'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Branch</p>
                  <p className="font-medium">{member.branches?.name || 'Unknown'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Registration Type</p>
                  <Badge variant={member.registration_source === 'admin' ? 'default' : 'secondary'}>
                    {member.registration_source === 'admin' ? 'Admin Registered' : 'Self Registered'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium">{formatDate(member.created_at!)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance History */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Attendance History</CardTitle>
            <CardDescription>
              Complete list of all events attended
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attendance.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No attendance records found
              </div>
            ) : (
              <div className="space-y-3">
                {attendance.map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{record.events?.title || 'Unknown Event'}</h3>
                      <p className="text-sm text-gray-500">
                        {record.events?.event_date ? formatDate(record.events.event_date) : 'N/A'}
                      </p>
                      {record.events?.branches?.name && (
                        <p className="text-xs text-gray-400 mt-1">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {record.events.branches.name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Check-in</p>
                      <p className="font-medium">
                        {new Date(record.checked_in_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    console.error('Error loading member details:', error)
    notFound()
  }
}
