'use client'

import { useEffect, useState } from 'react'
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
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const safeData = (data ?? []).map(d => ({
    ...d,
    male: d.male ?? 0,
    female: d.female ?? 0,
    total: d.total ?? 0,
  }))

  if (!mounted) return <div className="h-80" />

  if (safeData.length === 0) {
    return <div className="h-80 flex items-center justify-center text-gray-400 text-sm">No age data available</div>
  }

  return (
    <div style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={safeData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="male" fill="#3b82f6" name="Male" isAnimationActive={false} />
          <Bar dataKey="female" fill="#ec4899" name="Female" isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
