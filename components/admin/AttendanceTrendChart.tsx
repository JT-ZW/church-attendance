'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface AttendanceTrendData {
  date: string
  event: string
  attendance: number
}

interface AttendanceTrendChartProps {
  data: AttendanceTrendData[]
}

export default function AttendanceTrendChart({ data }: AttendanceTrendChartProps) {
  const safeData = data ?? []

  if (safeData.length === 0) {
    return <div className="h-80 flex items-center justify-center text-gray-400 text-sm">No trend data available</div>
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={safeData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 border rounded shadow-lg">
                    <p className="font-semibold">{payload[0].payload.event}</p>
                    <p className="text-sm text-gray-600">{payload[0].payload.date}</p>
                    <p className="text-blue-600 font-semibold">
                      Attendance: {payload[0].value}
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="attendance" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Attendance"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
