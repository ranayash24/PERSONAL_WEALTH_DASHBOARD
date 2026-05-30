'use client'

import { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils'

interface NetWorthDataPoint {
  date: string
  value: number
}

interface NetWorthChartProps {
  data: NetWorthDataPoint[]
  currency: string
}

type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'ALL'

const TIME_RANGE_DAYS: Record<TimeRange, number | null> = {
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  ALL: null,
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
  currency: string
}

function CustomTooltip({ active, payload, label, currency }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const value = payload[0].value
  const dateLabel = label
    ? new Date(label).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : ''

  return (
    <div className="bg-[#1e293b] border border-slate-700 rounded-lg shadow-xl px-4 py-3">
      <p className="text-xs text-slate-400 mb-1">{dateLabel}</p>
      <p className="text-sm font-semibold text-white">{formatCurrency(value, currency)}</p>
    </div>
  )
}

function formatYAxisTick(value: number, currency: string): string {
  return formatCurrencyCompact(value, currency)
}

export function NetWorthChart({ data, currency }: NetWorthChartProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('ALL')

  const filteredData = useMemo(() => {
    const days = TIME_RANGE_DAYS[selectedRange]
    if (days === null || !data || data.length === 0) return data ?? []

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return data.filter((point) => new Date(point.date) >= cutoffDate)
  }, [data, selectedRange])

  if (!data || data.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-3">
          <div className="w-6 h-1 bg-slate-600 rounded" />
        </div>
        <p className="text-slate-500 text-sm font-medium">Not enough history</p>
        <p className="text-slate-600 text-xs mt-1">
          Track your assets over time to see the trend
        </p>
      </div>
    )
  }

  const ranges: TimeRange[] = ['1M', '3M', '6M', '1Y', 'ALL']

  return (
    <div>
      {/* Time range selector */}
      <div className="flex items-center gap-1 mb-4">
        {ranges.map((range) => (
          <button
            key={range}
            onClick={() => setSelectedRange(range)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors duration-150 ${
              selectedRange === range
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={filteredData}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: string) =>
                new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              }
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={70}
              tickFormatter={(value: number) => formatYAxisTick(value, currency)}
            />
            <Tooltip
              content={<CustomTooltip currency={currency} />}
              cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#netWorthGradient)"
              isAnimationActive={true}
              animationDuration={400}
              animationEasing="ease-out"
              dot={false}
              activeDot={{ r: 4, fill: '#3b82f6', stroke: '#1e293b', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
