'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface AgeDistributionData {
  name: string
  total: number
  male: number
  female: number
}

interface AgeDistributionChartProps {
  data: AgeDistributionData[]
}

export default function AgeDistributionChart({ data }: AgeDistributionChartProps) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="male" fill="#3b82f6" name="Male" />
          <Bar dataKey="female" fill="#ec4899" name="Female" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
