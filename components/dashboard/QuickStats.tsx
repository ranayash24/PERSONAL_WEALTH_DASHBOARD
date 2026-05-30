import { Briefcase, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface TopAsset {
  name: string
  value: number
}

interface Performer {
  name: string
  change: number
}

interface QuickStatsProps {
  assetCount: number
  topAsset: TopAsset | null
  bestPerformer: Performer | null
  worstPerformer: Performer | null
  currency: string
}

export function QuickStats({
  assetCount,
  topAsset,
  bestPerformer,
  worstPerformer,
  currency,
}: QuickStatsProps) {
  const stats = [
    {
      label: 'Total Assets',
      value: assetCount.toString(),
      subValue: assetCount === 1 ? 'asset tracked' : 'assets tracked',
      icon: Briefcase,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-600/15 border-blue-500/20',
      valueColor: 'text-white',
    },
    {
      label: 'Highest Value',
      value: topAsset ? formatCurrency(topAsset.value, currency) : 'N/A',
      subValue: topAsset?.name ?? 'No assets',
      icon: DollarSign,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-600/15 border-cyan-500/20',
      valueColor: 'text-white',
    },
    {
      label: 'Best Performer',
      value: bestPerformer ? formatPercentage(bestPerformer.change) : 'N/A',
      subValue: bestPerformer?.name ?? 'No data',
      icon: TrendingUp,
      iconColor: 'text-green-400',
      iconBg: 'bg-green-600/15 border-green-500/20',
      valueColor:
        bestPerformer
          ? bestPerformer.change >= 0
            ? 'text-green-400'
            : 'text-red-400'
          : 'text-white',
    },
    {
      label: 'Worst Performer',
      value: worstPerformer ? formatPercentage(worstPerformer.change) : 'N/A',
      subValue: worstPerformer?.name ?? 'No data',
      icon: TrendingDown,
      iconColor: 'text-red-400',
      iconBg: 'bg-red-600/15 border-red-500/20',
      valueColor:
        worstPerformer
          ? worstPerformer.change < 0
            ? 'text-red-400'
            : 'text-green-400'
          : 'text-white',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="rounded-xl border border-white/10 bg-[#16213e] p-4 hover:border-white/15 transition-colors duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center border ${stat.iconBg}`}
              >
                <Icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
              {stat.label}
            </p>
            <p className={`text-xl font-bold ${stat.valueColor} leading-tight`}>
              {stat.value}
            </p>
            <p className="text-xs text-slate-600 mt-1 truncate" title={stat.subValue}>
              {stat.subValue}
            </p>
          </div>
        )
      })}
    </div>
  )
}
