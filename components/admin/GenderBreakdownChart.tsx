'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface GenderBreakdownChartProps {
  maleCount: number
  femaleCount: number
}

const COLORS = {
  male: '#3b82f6',
  female: '#ec4899',
}

export default function GenderBreakdownChart({ maleCount, femaleCount }: GenderBreakdownChartProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const total = (maleCount ?? 0) + (femaleCount ?? 0)

  // Recharts PieChart crashes on zero-value slices — only include slices with count > 0
  const data = [
    { name: 'Male', value: maleCount ?? 0 },
    { name: 'Female', value: femaleCount ?? 0 },
  ].filter((d) => d.value > 0)

  if (!mounted) return <div style={{ height: 320 }} />

  if (total === 0 || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-400 text-sm">
        No member data available
      </div>
    )
  }

  return (
    <div style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            dataKey="value"
            isAnimationActive={false}
          >
            {data.map((entry) => (
              <Cell
                key={`cell-${entry.name}`}
                fill={entry.name === 'Male' ? COLORS.male : COLORS.female}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined, name: string | undefined) => [
              `${value ?? 0} (${total > 0 ? Math.round(((value ?? 0) / total) * 100) : 0}%)`,
              name ?? '',
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center mt-4">
        <p className="text-2xl font-bold">{total}</p>
        <p className="text-sm text-gray-500">Total Members</p>
      </div>
    </div>
  )
}
