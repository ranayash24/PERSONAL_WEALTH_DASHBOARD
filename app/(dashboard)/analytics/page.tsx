import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { AllocationPieChart } from '@/components/charts/AllocationPieChart'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'
import { NetWorthChart } from '@/components/charts/NetWorthChart'
import { formatCurrency, getAssetCategoryColor, getAssetCategoryLabel } from '@/lib/utils'
import type { Metadata } from 'next'
import type { AssetCategory } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Analytics',
}

export const dynamic = 'force-dynamic'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AllocationEntry {
  category: string
  value: number
  percentage: number
}

interface HistoryPoint {
  date: string
  value: number
}

interface ProcessedAsset {
  id: string
  name: string
  category: AssetCategory
  currentValue: number
  purchasePrice: number | null
  gainLossDollar: number | null
  gainLossPercent: number | null
  portfolioPercent: number
}

interface RiskEntry {
  category: AssetCategory
  value: number
  percentage: number
  risk: 'HIGH' | 'MEDIUM' | 'LOW'
}

interface AnalyticsPageData {
  totalNetWorth: number
  assetCount: number
  allocationByCategory: AllocationEntry[]
  netWorthHistory: HistoryPoint[]
  processedAssets: ProcessedAsset[]
  riskEntries: RiskEntry[]
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getAnalyticsPageData(userId: string): Promise<AnalyticsPageData> {
  const assets = await db.asset.findMany({
    where: { userId },
    include: {
      valuations: {
        orderBy: { date: 'desc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const totalNetWorth = assets.reduce((sum, asset) => sum + asset.currentValue, 0)
  const assetCount = assets.length

  // ── Allocation by category ──────────────────────────────────────────────────
  const categoryTotals = new Map<AssetCategory, number>()
  for (const asset of assets) {
    const current = categoryTotals.get(asset.category) ?? 0
    categoryTotals.set(asset.category, current + asset.currentValue)
  }

  const allocationByCategory: AllocationEntry[] = Array.from(categoryTotals.entries())
    .map(([category, value]) => ({
      category,
      value,
      percentage: totalNetWorth > 0 ? (value / totalNetWorth) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)

  // ── Net worth history ───────────────────────────────────────────────────────
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  const dateSet = new Set<string>()
  for (const asset of assets) {
    for (const v of asset.valuations) {
      dateSet.add(new Date(v.date).toISOString().split('T')[0])
    }
  }
  dateSet.add(todayStr)

  const sortedDates = Array.from(dateSet).sort()

  const netWorthHistory: HistoryPoint[] = sortedDates.map((dateStr) => {
    const targetDate = new Date(`${dateStr}T23:59:59.999Z`)
    let total = 0

    for (const asset of assets) {
      if (dateStr === todayStr) {
        total += asset.currentValue
      } else {
        const validValuations = asset.valuations
          .map((v) => ({ date: new Date(v.date), value: v.value }))
          .filter((v) => v.date <= targetDate)
          .sort((a, b) => b.date.getTime() - a.date.getTime())

        if (validValuations.length > 0) {
          total += validValuations[0].value
        }
      }
    }

    return { date: dateStr, value: total }
  })

  // ── Processed assets (for tables and performance sections) ─────────────────
  const processedAssets: ProcessedAsset[] = assets.map((asset) => {
    const gainLossDollar =
      asset.purchasePrice != null ? asset.currentValue - asset.purchasePrice : null
    const gainLossPercent =
      asset.purchasePrice != null && asset.purchasePrice > 0
        ? ((asset.currentValue - asset.purchasePrice) / asset.purchasePrice) * 100
        : null
    const portfolioPercent = totalNetWorth > 0 ? (asset.currentValue / totalNetWorth) * 100 : 0

    return {
      id: asset.id,
      name: asset.name,
      category: asset.category,
      currentValue: asset.currentValue,
      purchasePrice: asset.purchasePrice ?? null,
      gainLossDollar,
      gainLossPercent,
      portfolioPercent,
    }
  })

  // ── Risk concentration ──────────────────────────────────────────────────────
  const riskEntries: RiskEntry[] = allocationByCategory.map((entry) => {
    const pct = entry.percentage
    const risk: 'HIGH' | 'MEDIUM' | 'LOW' = pct > 30 ? 'HIGH' : pct >= 20 ? 'MEDIUM' : 'LOW'
    return {
      category: entry.category as AssetCategory,
      value: entry.value,
      percentage: pct,
      risk,
    }
  })

  return {
    totalNetWorth,
    assetCount,
    allocationByCategory,
    netWorthHistory,
    processedAssets,
    riskEntries,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount: number, currency: string): string {
  return formatCurrency(amount, currency)
}

function fmtPct(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function riskBadgeClass(risk: 'HIGH' | 'MEDIUM' | 'LOW'): string {
  if (risk === 'HIGH')
    return 'bg-red-500/20 text-red-400 border border-red-500/30'
  if (risk === 'MEDIUM')
    return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
  return 'bg-green-500/20 text-green-400 border border-green-500/30'
}

function categoryBadgeStyle(category: AssetCategory): { backgroundColor: string } {
  const hex = getAssetCategoryColor(category)
  // Convert hex to rgb and apply 20% opacity background
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { backgroundColor: `rgba(${r}, ${g}, ${b}, 0.2)` }
}

function categoryTextStyle(category: AssetCategory): { color: string } {
  return { color: getAssetCategoryColor(category) }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [data, settings] = await Promise.all([
    getAnalyticsPageData(session.user.id),
    db.userSettings.findUnique({ where: { userId: session.user.id } }),
  ])

  const currency = settings?.currency ?? 'USD'

  const {
    totalNetWorth,
    assetCount,
    allocationByCategory,
    netWorthHistory,
    processedAssets,
    riskEntries,
  } = data

  // ── Section 1 computations ─────────────────────────────────────────────────
  const assetsWithGainLoss = processedAssets.filter((a) => a.gainLossPercent !== null)

  const bestAsset =
    assetsWithGainLoss.length > 0
      ? assetsWithGainLoss.reduce((prev, curr) =>
          (curr.gainLossPercent ?? -Infinity) > (prev.gainLossPercent ?? -Infinity) ? curr : prev
        )
      : null

  const worstAsset =
    assetsWithGainLoss.length > 0
      ? assetsWithGainLoss.reduce((prev, curr) =>
          (curr.gainLossPercent ?? Infinity) < (prev.gainLossPercent ?? Infinity) ? curr : prev
        )
      : null

  // ── Section 5 (Top Holdings) ───────────────────────────────────────────────
  const topHoldings = processedAssets
    .slice()
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 10)

  // ── Section 6 (Performance) ────────────────────────────────────────────────
  const sortedByGain = assetsWithGainLoss
    .slice()
    .sort((a, b) => (b.gainLossPercent ?? 0) - (a.gainLossPercent ?? 0))

  const top3Gainers = sortedByGain.slice(0, 3)
  const top3Losers = sortedByGain.slice(-3).reverse()

  // ── Risk counts ────────────────────────────────────────────────────────────
  const highRiskCount = riskEntries.filter((r) => r.risk === 'HIGH').length

  // ── Empty state ────────────────────────────────────────────────────────────
  if (assetCount === 0) {
    return (
      <div className="space-y-6 pb-20 lg:pb-0">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics</h2>
          <p className="text-slate-400 text-sm mt-1">Deep insights into your portfolio</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No assets yet</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
            Add your first asset to start seeing analytics, allocation breakdowns, and performance insights.
          </p>
          <Link
            href="/assets/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            Add your first asset
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics</h2>
          <p className="text-slate-400 text-sm mt-1">Deep insights into your portfolio</p>
        </div>
      </div>

      {/* ── Section 1: Portfolio Summary ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Worth */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 col-span-2 lg:col-span-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Total Net Worth
          </p>
          <p className="text-2xl font-bold text-white">{fmt(totalNetWorth, currency)}</p>
          <p className="text-xs text-slate-500 mt-1">Current portfolio value</p>
        </div>

        {/* Number of Assets */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Total Assets
          </p>
          <p className="text-2xl font-bold text-white">{assetCount}</p>
          <p className="text-xs text-slate-500 mt-1">
            {allocationByCategory.length} {allocationByCategory.length === 1 ? 'category' : 'categories'}
          </p>
        </div>

        {/* Best Performer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Best Performer
          </p>
          {bestAsset ? (
            <>
              <p className="text-sm font-semibold text-white truncate">{bestAsset.name}</p>
              <p className="text-green-400 font-bold text-lg mt-0.5">
                {fmtPct(bestAsset.gainLossPercent ?? 0)}
              </p>
            </>
          ) : (
            <p className="text-slate-500 text-sm">N/A</p>
          )}
        </div>

        {/* Worst Performer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Worst Performer
          </p>
          {worstAsset ? (
            <>
              <p className="text-sm font-semibold text-white truncate">{worstAsset.name}</p>
              <p className="text-red-400 font-bold text-lg mt-0.5">
                {fmtPct(worstAsset.gainLossPercent ?? 0)}
              </p>
            </>
          ) : (
            <p className="text-slate-500 text-sm">N/A</p>
          )}
        </div>
      </div>

      {/* ── Section 2: Asset Allocation ──────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white border-l-2 border-blue-500 pl-3 mb-5">
          Asset Allocation
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-slate-400 mb-3">Portfolio breakdown by category</p>
            <AllocationPieChart data={allocationByCategory} currency={currency} />
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-3">Value by category</p>
            <CategoryBarChart data={allocationByCategory} currency={currency} />
          </div>
        </div>
      </div>

      {/* ── Section 3: Net Worth History ─────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white border-l-2 border-blue-500 pl-3 mb-5">
          Net Worth History
        </h3>
        {netWorthHistory.length < 2 ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm font-medium">No valuation history yet</p>
            <p className="text-slate-600 text-xs mt-1">
              Update your asset values over time to see the trend chart.
            </p>
          </div>
        ) : (
          <NetWorthChart data={netWorthHistory} currency={currency} />
        )}
      </div>

      {/* ── Section 4: Risk Concentration Analysis ───────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-white border-l-2 border-blue-500 pl-3">
            Risk Concentration Analysis
          </h3>
          {highRiskCount > 0 ? (
            <span className="text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full">
              {highRiskCount} concentration {highRiskCount === 1 ? 'risk' : 'risks'} detected
            </span>
          ) : (
            <span className="text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full">
              No concentration risks
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {riskEntries.map((entry) => (
            <div
              key={entry.category}
              className="flex items-center justify-between p-4 rounded-lg bg-slate-800/60 border border-slate-700/50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      ...categoryBadgeStyle(entry.category),
                      ...categoryTextStyle(entry.category),
                    }}
                  >
                    {getAssetCategoryLabel(entry.category)}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white">{fmt(entry.value, currency)}</p>
                <p className="text-xs text-slate-400 mt-0.5">{entry.percentage.toFixed(1)}% of portfolio</p>
              </div>
              <span
                className={`ml-3 text-xs font-semibold px-2 py-1 rounded-md flex-shrink-0 ${riskBadgeClass(entry.risk)}`}
              >
                {entry.risk}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-4">
          Risk thresholds: HIGH &gt;30% · MEDIUM 20–30% · LOW &lt;20%
        </p>
      </div>

      {/* ── Section 5: Top Holdings Table ────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-white border-l-2 border-blue-500 pl-3">
            Top Holdings
          </h3>
          <Link
            href="/assets"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all assets →
          </Link>
        </div>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 px-1 w-8">#</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 px-2">Asset</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 px-2">Current Value</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 px-2">Purchase Price</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 px-2">Gain / Loss</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 px-2">% Portfolio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {topHoldings.map((asset, idx) => (
                <tr key={asset.id} className="group hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-1 text-slate-500 text-xs font-medium">{idx + 1}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-white font-medium">{asset.name}</p>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium inline-block mt-0.5"
                          style={{
                            ...categoryBadgeStyle(asset.category),
                            ...categoryTextStyle(asset.category),
                          }}
                        >
                          {getAssetCategoryLabel(asset.category)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right text-white font-medium">
                    {fmt(asset.currentValue, currency)}
                  </td>
                  <td className="py-3 px-2 text-right text-slate-400">
                    {asset.purchasePrice != null ? fmt(asset.purchasePrice, currency) : <span className="text-slate-600">N/A</span>}
                  </td>
                  <td className="py-3 px-2 text-right">
                    {asset.gainLossDollar != null && asset.gainLossPercent != null ? (
                      <div>
                        <p className={asset.gainLossDollar >= 0 ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                          {asset.gainLossDollar >= 0 ? '+' : ''}{fmt(asset.gainLossDollar, currency)}
                        </p>
                        <p className={`text-xs ${asset.gainLossPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {fmtPct(asset.gainLossPercent)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-600">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right text-slate-300">
                    {asset.portfolioPercent.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {processedAssets.length > 10 && (
          <p className="text-xs text-slate-600 mt-3 text-center">
            Showing top 10 of {processedAssets.length} assets.{' '}
            <Link href="/assets" className="text-blue-500 hover:text-blue-400">
              View all →
            </Link>
          </p>
        )}
      </div>

      {/* ── Section 6: Performance Analysis ─────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white border-l-2 border-blue-500 pl-3 mb-5">
          Performance Analysis
        </h3>
        {assetsWithGainLoss.length === 0 ? (
          <p className="text-slate-500 text-sm">
            No assets with purchase prices set. Add purchase prices to your assets to see performance analysis.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Best performers */}
            <div>
              <p className="text-sm font-medium text-green-400 mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Top Gainers
              </p>
              <div className="space-y-2">
                {top3Gainers.length === 0 ? (
                  <p className="text-slate-600 text-sm">No gainers</p>
                ) : (
                  top3Gainers.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-green-500/5 border border-green-500/20"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{asset.name}</p>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium inline-block mt-0.5"
                          style={{
                            ...categoryBadgeStyle(asset.category),
                            ...categoryTextStyle(asset.category),
                          }}
                        >
                          {getAssetCategoryLabel(asset.category)}
                        </span>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <p className="text-green-400 font-bold text-base">
                          {fmtPct(asset.gainLossPercent ?? 0)}
                        </p>
                        <p className="text-green-600 text-xs">
                          +{fmt(asset.gainLossDollar ?? 0, currency)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Worst performers */}
            <div>
              <p className="text-sm font-medium text-red-400 mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17H5m0 0v-8m0 8l8-8 4 4 6-6" />
                </svg>
                Worst Performers
              </p>
              <div className="space-y-2">
                {top3Losers.length === 0 ? (
                  <p className="text-slate-600 text-sm">No losses</p>
                ) : (
                  top3Losers.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-red-500/5 border border-red-500/20"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{asset.name}</p>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium inline-block mt-0.5"
                          style={{
                            ...categoryBadgeStyle(asset.category),
                            ...categoryTextStyle(asset.category),
                          }}
                        >
                          {getAssetCategoryLabel(asset.category)}
                        </span>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <p className="text-red-400 font-bold text-base">
                          {fmtPct(asset.gainLossPercent ?? 0)}
                        </p>
                        <p className="text-red-600 text-xs">
                          {fmt(asset.gainLossDollar ?? 0, currency)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
