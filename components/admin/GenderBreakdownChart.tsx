'use client'

interface GenderBreakdownChartProps {
  maleCount: number
  femaleCount: number
}

export default function GenderBreakdownChart({ maleCount, femaleCount }: GenderBreakdownChartProps) {
  const male = maleCount ?? 0
  const female = femaleCount ?? 0
  const total = male + female

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
        No member data available
      </div>
    )
  }

  const malePct = Math.round((male / total) * 100)
  const femalePct = 100 - malePct

  return (
    <div className="space-y-6 py-4">
      {/* Stacked bar */}
      <div className="w-full h-8 rounded-full overflow-hidden flex">
        {male > 0 && (
          <div className="h-full bg-blue-500" style={{ width: `${malePct}%` }} />
        )}
        {female > 0 && (
          <div className="h-full bg-pink-400" style={{ width: `${femalePct}%` }} />
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm font-medium text-gray-700">Male</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">{male}</p>
          <p className="text-sm text-gray-500 mt-1">{malePct}% of total</p>
        </div>
        <div className="bg-pink-50 rounded-lg p-4 border border-pink-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-pink-400" />
            <span className="text-sm font-medium text-gray-700">Female</span>
          </div>
          <p className="text-3xl font-bold text-pink-500">{female}</p>
          <p className="text-sm text-gray-500 mt-1">{femalePct}% of total</p>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500">
        <span className="font-semibold text-gray-800 text-base">{total}</span> total members
      </div>
    </div>
  )
}
