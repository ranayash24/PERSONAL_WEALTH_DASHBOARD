import type { Asset, AssetCategory, Valuation, UserSettings } from '@prisma/client'

export type AssetWithValuations = Asset & {
  valuations: Valuation[]
}

export type AssetSummary = {
  totalNetWorth: number
  assetCount: number
  byCategory: Record<AssetCategory, number>
  topAssets: Asset[]
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface DashboardData {
  assets: AssetWithValuations[]
  settings: UserSettings | null
  totalNetWorth: number
  previousNetWorth: number
}
