import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NetWorthCard } from '@/components/dashboard/NetWorthCard'
import { QuickStats } from '@/components/dashboard/QuickStats'
import { RecentAssets } from '@/components/dashboard/RecentAssets'
import { NetWorthChart } from '@/components/charts/NetWorthChart'
import { AllocationPieChart } from '@/components/charts/AllocationPieChart'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'
import type { Metadata } from 'next'
import type { AssetCategory } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Dashboard',
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

interface TopAssetItem {
  id: string
  name: string
  category: string
  value: number
  change: number
}

interface RecentActivityItem {
  id: string
  name: string
  category: string
  currentValue: number
  updatedAt: string
}

interface NetWorthChanges {
  day: number
  week: number
  month: number
  year: number
}

interface AnalyticsData {
  totalNetWorth: number
  netWorthChange: NetWorthChanges
  allocationByCategory: AllocationEntry[]
  netWorthHistory: HistoryPoint[]
  topAssets: TopAssetItem[]
  recentActivity: RecentActivityItem[]
}

// ─── Data fetching (direct DB call, no HTTP) ──────────────────────────────────

function calcChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / Math.abs(previous)) * 100
}

function getValueAtDate(
  assetValuationsMap: Map<string, { date: Date; value: number }[]>,
  targetDate: Date
): number {
  let total = 0
  Array.from(assetValuationsMap.values()).forEach((valuations) => {
    const validValuations = valuations
      .filter((v: { date: Date; value: number }) => v.date <= targetDate)
      .sort((a: { date: Date; value: number }, b: { date: Date; value: number }) => b.date.getTime() - a.date.getTime())
    if (validValuations.length > 0) {
      total += validValuations[0].value
    }
  })
  return total
}

async function getAnalyticsData(userId: string): Promise<AnalyticsData> {
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

  // Build valuation map for history
  const assetValuationsMap = new Map<string, { date: Date; value: number }[]>()
  for (const asset of assets) {
    assetValuationsMap.set(
      asset.id,
      asset.valuations.map((v) => ({ date: new Date(v.date), value: v.value }))
    )
  }

  const now = new Date()
  const dayAgo = new Date(now); dayAgo.setDate(dayAgo.getDate() - 1)
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
  const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30)
  const yearAgo = new Date(now); yearAgo.setDate(yearAgo.getDate() - 365)

  const dayValue = getValueAtDate(assetValuationsMap, dayAgo)
  const weekValue = getValueAtDate(assetValuationsMap, weekAgo)
  const monthValue = getValueAtDate(assetValuationsMap, monthAgo)
  const yearValue = getValueAtDate(assetValuationsMap, yearAgo)

  const netWorthChange: NetWorthChanges = {
    day: dayValue > 0 ? calcChange(totalNetWorth, dayValue) : 0,
    week: weekValue > 0 ? calcChange(totalNetWorth, weekValue) : 0,
    month: monthValue > 0 ? calcChange(totalNetWorth, monthValue) : 0,
    year: yearValue > 0 ? calcChange(totalNetWorth, yearValue) : 0,
  }

  // Allocation by category
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

  // Net worth history
  const todayStr = now.toISOString().split('T')[0]
  const allValuations = assets.flatMap((asset) =>
    asset.valuations.map((v) => ({
      assetId: asset.id,
      date: new Date(v.date),
    }))
  )

  const dateSet = new Set<string>()
  for (const v of allValuations) {
    dateSet.add(v.date.toISOString().split('T')[0])
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

  // Top 5 assets
  const topAssets: TopAssetItem[] = assets
    .slice()
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 5)
    .map((asset) => ({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      value: asset.currentValue,
      change:
        asset.purchasePrice && asset.purchasePrice > 0
          ? ((asset.currentValue - asset.purchasePrice) / asset.purchasePrice) * 100
          : 0,
    }))

  // Recent activity (5 most recently updated)
  const recentActivity: RecentActivityItem[] = assets.slice(0, 5).map((asset) => ({
    id: asset.id,
    name: asset.name,
    category: asset.category,
    currentValue: asset.currentValue,
    updatedAt: asset.updatedAt.toISOString(),
  }))

  return {
    totalNetWorth,
    netWorthChange,
    allocationByCategory,
    netWorthHistory,
    topAssets,
    recentActivity,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [analyticsData, settings] = await Promise.all([
    getAnalyticsData(session.user.id),
    db.userSettings.findUnique({ where: { userId: session.user.id } }),
  ])

  const currency = settings?.currency ?? 'USD'

  const {
    totalNetWorth,
    netWorthChange,
    allocationByCategory,
    netWorthHistory,
    topAssets,
    recentActivity,
  } = analyticsData

  // Derive QuickStats data
  const topAsset =
    topAssets.length > 0
      ? { name: topAssets[0].name, value: topAssets[0].value }
      : null

  const assetsWithChange = topAssets.filter((a) => a.change !== 0)
  const bestPerformer =
    assetsWithChange.length > 0
      ? assetsWithChange.reduce((prev, curr) => (curr.change > prev.change ? curr : prev))
      : null
  const worstPerformer =
    assetsWithChange.length > 0
      ? assetsWithChange.reduce((prev, curr) => (curr.change < prev.change ? curr : prev))
      : null

  // Count total distinct assets for QuickStats
  const allAssets = await db.asset.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  })
  const assetCount = allAssets.length

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Welcome back{session.user.name ? `, ${session.user.name.split(' ')[0]}` : ''}
          </h2>
          <p className="text-slate-400 text-sm mt-1">Here&apos;s your financial overview</p>
        </div>
        <Link
          href="/assets/new"
          className="btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Asset
        </Link>
      </div>

      {/* Net Worth Card */}
      <NetWorthCard
        totalNetWorth={totalNetWorth}
        changes={netWorthChange}
        currency={currency}
      />

      {/* Quick Stats */}
      <QuickStats
        assetCount={assetCount}
        topAsset={topAsset}
        bestPerformer={bestPerformer ? { name: bestPerformer.name, change: bestPerformer.change } : null}
        worstPerformer={worstPerformer ? { name: worstPerformer.name, change: worstPerformer.change } : null}
        currency={currency}
      />

      {/* Net Worth Over Time */}
      <div className="rounded-xl border border-white/10 bg-[#16213e] p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-white">Net Worth Over Time</h3>
          <p className="text-sm text-slate-500 mt-0.5">Historical portfolio value</p>
        </div>
        <NetWorthChart data={netWorthHistory} currency={currency} />
      </div>

      {/* Allocation + Category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allocation Pie */}
        <div className="rounded-xl border border-white/10 bg-[#16213e] p-6">
          <div className="mb-2">
            <h3 className="text-base font-semibold text-white">Asset Allocation</h3>
            <p className="text-sm text-slate-500 mt-0.5">Portfolio breakdown by category</p>
          </div>
          <AllocationPieChart data={allocationByCategory} currency={currency} />
        </div>

        {/* Category Bar Chart */}
        <div className="rounded-xl border border-white/10 bg-[#16213e] p-6">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-white">Value by Category</h3>
            <p className="text-sm text-slate-500 mt-0.5">Comparative asset values</p>
          </div>
          <CategoryBarChart data={allocationByCategory} currency={currency} />
        </div>
      </div>

      {/* Recent Assets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Recent Assets</h3>
          <Link
            href="/assets"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all →
          </Link>
        </div>
        <RecentAssets assets={recentActivity} currency={currency} />
      </div>
    </div>
  )
}
