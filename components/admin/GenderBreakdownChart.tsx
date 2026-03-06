'use client'

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
  const data = [
    { name: 'Male', value: maleCount ?? 0 },
    { name: 'Female', value: femaleCount ?? 0 },
  ]

  const total = (maleCount ?? 0) + (femaleCount ?? 0)

  if (total === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-400 text-sm">
        No member data available
      </div>
    )
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value, percent }) => 
              `${name}: ${value} (${((percent ?? 0) * 100).toFixed(0)}%)`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell 
                key={`cell-${entry.name}`} 
                fill={entry.name === 'Male' ? COLORS.male : COLORS.female} 
              />
            ))}
          </Pie>
          <Tooltip />
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
