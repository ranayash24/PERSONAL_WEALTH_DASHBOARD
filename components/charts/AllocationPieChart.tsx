'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface AllocationData {
  category: string
  value: number
  percentage: number
}

interface AllocationPieChartProps {
  data: AllocationData[]
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
    name: string
    value: number
    payload: AllocationData
  }>
  currency?: string
}

function CustomTooltip({ active, payload, currency = 'USD' }: CustomTooltipProps) {
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

interface CustomLegendProps {
  payload?: Array<{
    value: string
    color: string
  }>
  data: AllocationData[]
}

function CustomLegend({ data }: CustomLegendProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center mt-2">
      {data.map((item) => (
        <div key={item.category} className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
            style={{ backgroundColor: getCategoryColor(item.category) }}
          />
          <span className="text-xs text-slate-400">{getCategoryLabel(item.category)}</span>
          <span className="text-xs text-slate-500">({item.percentage.toFixed(1)}%)</span>
        </div>
      ))}
    </div>
  )
}

export function AllocationPieChart({ data, currency }: AllocationPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[320px] text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-3">
          <div className="w-6 h-6 rounded-full border-2 border-slate-600 border-dashed" />
        </div>
        <p className="text-slate-500 text-sm font-medium">No allocation data</p>
        <p className="text-slate-600 text-xs mt-1">Add assets to see your portfolio allocation</p>
      </div>
    )
  }

  const chartData = data.map((item) => ({
    ...item,
    name: getCategoryLabel(item.category),
  }))

  return (
    <div style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            isAnimationActive={true}
            animationDuration={400}
            animationEasing="ease-out"
          >
            {chartData.map((entry) => (
              <Cell
                key={`cell-${entry.category}`}
                fill={getCategoryColor(entry.category)}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Legend content={() => <CustomLegend data={data} />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
