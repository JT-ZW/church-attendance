'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface Props {
  maleCount: number
  femaleCount: number
  ageGroups: {
    '0-12': number
    '13-18': number
    '19-35': number
    '36-60': number
    '60+': number
  }
}

export default function EventDemographics({ maleCount, femaleCount, ageGroups }: Props) {
  const genderData = [
    { name: 'Male', value: maleCount, color: '#3b82f6' },
    { name: 'Female', value: femaleCount, color: '#ec4899' },
  ]

  const ageData = [
    { name: '0-12', value: ageGroups['0-12'], color: '#8b5cf6' },
    { name: '13-18', value: ageGroups['13-18'], color: '#06b6d4' },
    { name: '19-35', value: ageGroups['19-35'], color: '#10b981' },
    { name: '36-60', value: ageGroups['36-60'], color: '#f59e0b' },
    { name: '60+', value: ageGroups['60+'], color: '#ef4444' },
  ].filter(d => d.value > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gender Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Gender Distribution</CardTitle>
          <CardDescription>Breakdown by gender</CardDescription>
        </CardHeader>
        <CardContent>
          {maleCount === 0 && femaleCount === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No attendees yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Age Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Age Distribution</CardTitle>
          <CardDescription>Breakdown by age groups</CardDescription>
        </CardHeader>
        <CardContent>
          {ageData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No age data available
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={ageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-5 gap-2 mt-4">
                {Object.entries(ageGroups).map(([group, count]) => (
                  <div key={group} className="text-center">
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-gray-500">{group}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
