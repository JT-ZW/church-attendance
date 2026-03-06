'use client'

interface AttendanceTrendData {
  date: string
  event: string
  attendance: number
}

interface AttendanceTrendChartProps {
  data: AttendanceTrendData[]
}

const CHART_H = 280
const CHART_W = 600
const PADDING = { top: 20, right: 20, bottom: 56, left: 44 }

export default function AttendanceTrendChart({ data }: AttendanceTrendChartProps) {
  const safe = (data ?? []).map(d => ({
    date:       String(d.date       ?? ''),
    event:      String(d.event      ?? ''),
    attendance: Number(d.attendance ?? 0),
  }))

  if (safe.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height: CHART_H }}>
        No attendance data in this period
      </div>
    )
  }

  const maxVal = Math.max(...safe.map(d => d.attendance), 1)
  const innerW = CHART_W - PADDING.left - PADDING.right
  const innerH = CHART_H - PADDING.top  - PADDING.bottom

  // X positions
  const xPos = (i: number) =>
    safe.length === 1 ? innerW / 2 : (i / (safe.length - 1)) * innerW

  // Y position (inverted — 0 at bottom)
  const yPos = (v: number) => innerH - (v / maxVal) * innerH

  // Build polyline string
  const points = safe
    .map((d, i) => `${xPos(i)},${yPos(d.attendance)}`)
    .join(' ')

  // Area fill path
  const areaPath =
    `M ${xPos(0)},${yPos(safe[0].attendance)} ` +
    safe.map((d, i) => `L ${xPos(i)},${yPos(d.attendance)}`).join(' ') +
    ` L ${xPos(safe.length - 1)},${innerH} L ${xPos(0)},${innerH} Z`

  // Y tick values
  const yTicks = [...new Set([0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * maxVal)))]

  // Show X labels every N points to avoid crowding
  const labelEvery = Math.max(1, Math.ceil(safe.length / 8))

  return (
    <div className="overflow-x-auto">
      <svg width={CHART_W} height={CHART_H} className="block mx-auto">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#3b82f6" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>

        <g transform={`translate(${PADDING.left},${PADDING.top})`}>
          {/* Y grid + labels */}
          {yTicks.map((tick, i) => {
            const y = yPos(tick)
            return (
              <g key={`ytick-${i}`}>
                <line x1={0} y1={y} x2={innerW} y2={y} stroke="#e5e7eb" strokeWidth={1} />
                <text x={-6} y={y + 4} textAnchor="end" fontSize={11} fill="#9ca3af">{tick}</text>
              </g>
            )
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#areaGrad)" />

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Dots + tooltips */}
          {safe.map((d, i) => (
            <g key={i}>
              <title>{d.event}{' '}({d.date}): {d.attendance} attendees</title>
              <circle
                cx={xPos(i)}
                cy={yPos(d.attendance)}
                r={4}
                fill="#ffffff"
                stroke="#3b82f6"
                strokeWidth={2}
              />
            </g>
          ))}

          {/* X axis labels */}
          {safe.map((d, i) => (
            i % labelEvery === 0 ? (
              <text
                key={i}
                x={xPos(i)}
                y={innerH + 18}
                textAnchor="middle"
                fontSize={10}
                fill="#6b7280"
                transform={`rotate(-35, ${xPos(i)}, ${innerH + 18})`}
              >
                {d.date}
              </text>
            ) : null
          ))}

          {/* Baseline */}
          <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke="#d1d5db" strokeWidth={1} />
        </g>
      </svg>
    </div>
  )
}
