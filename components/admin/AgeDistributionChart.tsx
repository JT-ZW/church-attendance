'use client'

interface AgeDistributionData {
  name: string
  total: number
  male: number
  female: number
}

interface AgeDistributionChartProps {
  data: AgeDistributionData[]
}

const CHART_H = 280
const CHART_W = 500
const PADDING = { top: 20, right: 16, bottom: 64, left: 36 }

export default function AgeDistributionChart({ data }: AgeDistributionChartProps) {
  const safe = (data ?? []).map(d => ({
    name:   String(d.name   ?? ''),
    male:   Number(d.male   ?? 0),
    female: Number(d.female ?? 0),
  }))

  if (safe.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height: CHART_H }}>
        No age data available
      </div>
    )
  }

  const maxVal = Math.max(...safe.flatMap(d => [d.male, d.female]), 1)
  const innerW  = CHART_W - PADDING.left - PADDING.right
  const innerH  = CHART_H - PADDING.top  - PADDING.bottom

  const groupW  = innerW / safe.length
  const barW    = Math.min(groupW * 0.32, 28)
  const gap     = 3

  const yTicks = [...new Set([0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * maxVal)))]

  const barH = (val: number) => (val / maxVal) * innerH

  return (
    <div className="overflow-x-auto -mx-2">
      <svg width={CHART_W} height={CHART_H} className="block mx-auto" style={{ minWidth: CHART_W }}>
        <g transform={`translate(${PADDING.left},${PADDING.top})`}>
          {/* Y-axis grid + labels */}
          {yTicks.map((tick, i) => {
            const y = innerH - (tick / maxVal) * innerH
            return (
              <g key={`ytick-${i}`}>
                <line x1={0} y1={y} x2={innerW} y2={y} stroke="#e5e7eb" strokeWidth={1} />
                <text x={-6} y={y + 4} textAnchor="end" fontSize={11} fill="#9ca3af">{tick}</text>
              </g>
            )
          })}

          {/* Bars */}
          {safe.map((group, i) => {
            const cx = i * groupW + groupW / 2
            const mx = cx - gap / 2 - barW
            const fx = cx + gap / 2
            return (
              <g key={group.name}>
                {/* Male bar */}
                <rect
                  x={mx}
                  y={innerH - barH(group.male)}
                  width={barW}
                  height={barH(group.male)}
                  fill="#3b82f6"
                  rx={2}
                />
                <text
                  x={mx + barW / 2}
                  y={Math.max(10, innerH - barH(group.male) - 6)}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={600}
                  fill="#3b82f6"
                >
                  {group.male}
                </text>
                {/* Female bar */}
                <rect
                  x={fx}
                  y={innerH - barH(group.female)}
                  width={barW}
                  height={barH(group.female)}
                  fill="#ec4899"
                  rx={2}
                />
                <text
                  x={fx + barW / 2}
                  y={Math.max(10, innerH - barH(group.female) - 6)}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={600}
                  fill="#ec4899"
                >
                  {group.female}
                </text>
                {/* X axis label — wrap on space if needed */}
                {group.name.includes(' ') ? (
                  group.name.split(' ').map((word, wi) => (
                    <text
                      key={wi}
                      x={cx}
                      y={innerH + 18 + wi * 13}
                      textAnchor="middle"
                      fontSize={10}
                      fill="#6b7280"
                    >
                      {word}
                    </text>
                  ))
                ) : (
                  <text
                    x={cx}
                    y={innerH + 18}
                    textAnchor="middle"
                    fontSize={11}
                    fill="#6b7280"
                  >
                    {group.name}
                  </text>
                )}
              </g>
            )
          })}

          {/* X axis baseline */}
          <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke="#d1d5db" strokeWidth={1} />
        </g>

        {/* Legend */}
        <g transform={`translate(${CHART_W / 2 - 64}, ${CHART_H - 14})`}>
          <rect x={0}  y={0} width={10} height={10} fill="#3b82f6" rx={2} />
          <text x={14} y={9} fontSize={11} fill="#6b7280">Male</text>
          <rect x={60} y={0} width={10} height={10} fill="#ec4899" rx={2} />
          <text x={74} y={9} fontSize={11} fill="#6b7280">Female</text>
        </g>
      </svg>
    </div>
  )
}
