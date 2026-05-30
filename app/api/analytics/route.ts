import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import type { AssetCategory } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface AllocationEntry {
  category: string
  value: number
  percentage: number
}

interface HistoryPoint {
  date: string
  value: number
}

interface TopAsset {
  id: string
  name: string
  category: string
  value: number
  change: number
}

interface RecentActivity {
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

interface AnalyticsResponse {
  totalNetWorth: number
  netWorthChange: NetWorthChanges
  allocationByCategory: AllocationEntry[]
  netWorthHistory: HistoryPoint[]
  topAssets: TopAsset[]
  recentActivity: RecentActivity[]
}

function getValueAtDate(
  assetValuations: Map<string, { date: Date; value: number }[]>,
  targetDate: Date
): number {
  let total = 0
  Array.from(assetValuations.values()).forEach((valuations) => {
    const validValuations = valuations
      .filter((v: { date: Date; value: number }) => v.date <= targetDate)
      .sort((a: { date: Date; value: number }, b: { date: Date; value: number }) => b.date.getTime() - a.date.getTime())
    if (validValuations.length > 0) {
      total += validValuations[0].value
    }
  })
  return total
}

function calcChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / Math.abs(previous)) * 100
}

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Fetch all assets with all valuations
    const assets = await db.asset.findMany({
      where: { userId },
      include: {
        valuations: {
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Current total net worth
    const totalNetWorth = assets.reduce((sum, asset) => sum + asset.currentValue, 0)

    // Build per-asset valuation map for history computation
    const assetValuationsMap = new Map<string, { date: Date; value: number }[]>()
    for (const asset of assets) {
      assetValuationsMap.set(
        asset.id,
        asset.valuations.map((v) => ({ date: new Date(v.date), value: v.value }))
      )
    }

    // Compute net worth changes at specific past dates
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

    // Net worth history: collect all unique dates from all valuations
    // For each date, sum the latest valuation per asset on or before that date
    const allValuations = assets.flatMap((asset) =>
      asset.valuations.map((v) => ({
        assetId: asset.id,
        date: new Date(v.date),
        value: v.value,
      }))
    )

    // Also add "today" as a data point using currentValue
    const todayStr = now.toISOString().split('T')[0]

    // Collect unique date strings (YYYY-MM-DD)
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
          // Latest valuation on or before this date
          const validValuations = asset.valuations
            .map((v) => ({ date: new Date(v.date), value: v.value }))
            .filter((v) => v.date <= targetDate)
            .sort((a, b) => b.date.getTime() - a.date.getTime())

          if (validValuations.length > 0) {
            total += validValuations[0].value
          }
          // If no valuation before this date, asset didn't exist yet — don't add
        }
      }

      return { date: dateStr, value: total }
    })

    // Top 5 assets by current value
    const topAssets: TopAsset[] = assets
      .slice()
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 5)
      .map((asset) => {
        const change =
          asset.purchasePrice && asset.purchasePrice > 0
            ? ((asset.currentValue - asset.purchasePrice) / asset.purchasePrice) * 100
            : 0
        return {
          id: asset.id,
          name: asset.name,
          category: asset.category,
          value: asset.currentValue,
          change,
        }
      })

    // Recent activity: 5 most recently updated assets
    const recentActivity: RecentActivity[] = assets.slice(0, 5).map((asset) => ({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      currentValue: asset.currentValue,
      updatedAt: asset.updatedAt.toISOString(),
    }))

    const response: AnalyticsResponse = {
      totalNetWorth,
      netWorthChange,
      allocationByCategory,
      netWorthHistory,
      topAssets,
      recentActivity,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Analytics API Error]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
