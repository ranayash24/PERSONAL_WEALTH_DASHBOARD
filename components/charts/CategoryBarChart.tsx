'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils'

interface CategoryData {
  category: string
  value: number
  percentage: number
}

interface CategoryBarChartProps {
  data: CategoryData[]
  currency: string
}

const CATEGORY_COLORS: Record<string, string> = {
  STOCKS: '#3b82f6',
  BONDS: '#8b5cf6',
  REAL_ESTATE: '#22c55e',
  CRYPTO: '#f97316',
  CASH: '#06b6d4',
  COMMODITIES: '#eab308',
  PRIVATE_EQUITY: '#ec4899',
  ALTERNATIVE: '#a78bfa',
  RETIREMENT: '#10b981',
  OTHER: '#6b7280',
}

const CATEGORY_LABELS: Record<string, string> = {
  STOCKS: 'Stocks',
  BONDS: 'Bonds',
  REAL_ESTATE: 'Real Estate',
  CRYPTO: 'Crypto',
  CASH: 'Cash',
  COMMODITIES: 'Commodities',
  PRIVATE_EQUITY: 'Private Equity',
  ALTERNATIVE: 'Alternative',
  RETIREMENT: 'Retirement',
  OTHER: 'Other',
}

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#6b7280'
}

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload: CategoryData
  }>
  currency: string
}

function CustomTooltip({ active, payload, currency }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const item = payload[0]
  const data = item.payload

  return (
    <div className="bg-[#1e293b] border border-slate-700 rounded-lg shadow-xl px-4 py-3">
      <p className="text-sm font-semibold text-white mb-1">{getCategoryLabel(data.category)}</p>
      <p className="text-xs text-slate-400">
        Value: <span className="text-white font-medium">{formatCurrency(data.value, currency)}</span>
      </p>
      <p className="text-xs text-slate-400">
        Share: <span className="text-white font-medium">{data.percentage.toFixed(1)}%</span>
      </p>
    </div>
  )
}

export function CategoryBarChart({ data, currency }: CategoryBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-center">
        <p className="text-slate-500 text-sm font-medium">No category data</p>
        <p className="text-slate-600 text-xs mt-1">Add assets to see breakdown</p>
      </div>
    )
  }

  const sortedData = [...data].sort((a, b) => b.value - a.value)
  const chartData = sortedData.map((item) => ({
    ...item,
    label: getCategoryLabel(item.category),
  }))

  const chartHeight = Math.max(200, chartData.length * 40)

  return (
    <div style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => formatCurrencyCompact(value, currency)}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip
            content={<CustomTooltip currency={currency} />}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            isAnimationActive={true}
            animationDuration={400}
            animationEasing="ease-out"
          >
            {chartData.map((entry) => (
              <Cell
                key={`cell-${entry.category}`}
                fill={getCategoryColor(entry.category)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
