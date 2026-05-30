import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils'

interface NetWorthChanges {
  day: number
  week: number
  month: number
  year: number
}

interface NetWorthCardProps {
  totalNetWorth: number
  changes: NetWorthChanges
  currency: string
}

interface ChangePillProps {
  label: string
  value: number
}

function ChangePill({ label, value }: ChangePillProps) {
  const isPositive = value > 0
  const isNegative = value < 0
  const isNeutral = value === 0

  const sign = isPositive ? '+' : ''
  const formatted = `${sign}${value.toFixed(2)}%`

  return (
    <div
      className={`flex flex-col items-center px-3 py-1.5 rounded-lg border text-center min-w-[56px] ${
        isPositive
          ? 'bg-green-500/10 border-green-500/20 text-green-400'
          : isNegative
            ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : 'bg-slate-700/50 border-slate-700 text-slate-400'
      }`}
    >
      <span className="text-[10px] font-medium text-current opacity-70 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-xs font-semibold mt-0.5">{isNeutral ? '—' : formatted}</span>
    </div>
  )
}

export function NetWorthCard({ totalNetWorth, changes, currency }: NetWorthCardProps) {
  const overallTrend = changes.month > 0 ? 'positive' : changes.month < 0 ? 'negative' : 'neutral'

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#16213e] to-[#1a1a2e] p-6 shadow-card-glow">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/3 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Total Net Worth
            </p>
            <p className="text-xs text-slate-600 mt-0.5">Across all asset classes</p>
          </div>
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
              overallTrend === 'positive'
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : overallTrend === 'negative'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-slate-700/50 text-slate-400 border border-slate-700'
            }`}
          >
            {overallTrend === 'positive' ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : overallTrend === 'negative' ? (
              <TrendingDown className="w-3.5 h-3.5" />
            ) : null}
            <span>
              {overallTrend !== 'neutral'
                ? `${changes.month > 0 ? '+' : ''}${changes.month.toFixed(2)}% (30d)`
                : 'No history'}
            </span>
          </div>
        </div>

        {/* Main value */}
        <div className="mb-6">
          <p className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            {formatCurrencyCompact(totalNetWorth, currency)}
          </p>
          <p className="text-lg text-slate-500 mt-1">
            {formatCurrency(totalNetWorth, currency)}
          </p>
        </div>

        {/* Period change pills */}
        <div className="flex items-center gap-2 pt-4 border-t border-white/5">
          <span className="text-xs text-slate-600 mr-1 hidden sm:inline">Change:</span>
          <ChangePill label="1D" value={changes.day} />
          <ChangePill label="1W" value={changes.week} />
          <ChangePill label="1M" value={changes.month} />
          <ChangePill label="1Y" value={changes.year} />
        </div>
      </div>
    </div>
  )
}
