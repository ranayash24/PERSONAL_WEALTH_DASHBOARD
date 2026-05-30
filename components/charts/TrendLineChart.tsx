'use client'

import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface TrendDataPoint {
  date: string
  value: number
}

interface TrendLineChartProps {
  data: TrendDataPoint[]
  positive: boolean
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const dateLabel = label
    ? new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : ''

  return (
    <div className="bg-[#1e293b] border border-slate-700 rounded-md shadow-xl px-2.5 py-1.5">
      <p className="text-[10px] text-slate-400">{dateLabel}</p>
      <p className="text-xs font-semibold text-white">
        {formatCurrency(payload[0].value, 'USD')}
      </p>
    </div>
  )
}

export function TrendLineChart({ data, positive }: TrendLineChartProps) {
  const color = positive ? '#22c55e' : '#ef4444'

  if (!data || data.length === 0) {
    return <div style={{ height: 60 }} className="flex items-center justify-center">
      <div className="w-full h-px bg-slate-700" />
    </div>
  }

  return (
    <div style={{ height: 60 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <Tooltip
            content={<CustomTooltip />}
            cursor={false}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: color, stroke: 'transparent' }}
            isAnimationActive={true}
            animationDuration={400}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
