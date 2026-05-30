import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { AssetCategory } from '@prisma/client'

/**
 * Merges Tailwind CSS class names, handling conflicts gracefully.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as a currency string using Intl.NumberFormat.
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formats a large currency number in compact form (e.g., $1.2M, $450K).
 */
export function formatCurrencyCompact(amount: number, currency: string = 'USD'): string {
  const absAmount = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''

  if (absAmount >= 1_000_000_000) {
    return `${sign}${new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 1 }).format(absAmount / 1_000_000_000)}B`
  }
  if (absAmount >= 1_000_000) {
    return `${sign}${new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 1 }).format(absAmount / 1_000_000)}M`
  }
  if (absAmount >= 1_000) {
    return `${sign}${new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 1 }).format(absAmount / 1_000)}K`
  }
  return formatCurrency(amount, currency)
}

/**
 * Formats a Date or date string to a readable format.
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

/**
 * Formats a Date to a short relative description like "2 days ago".
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(d)
}

/**
 * Formats a number as a percentage string.
 */
export function formatPercentage(value: number): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100)
  return value >= 0 ? `+${formatted}` : formatted
}

/**
 * Calculates the gain/loss percentage between current and purchase price.
 */
export function calculateGainLossPercent(
  currentValue: number,
  purchasePrice: number | null | undefined
): number | null {
  if (!purchasePrice || purchasePrice === 0) return null
  return ((currentValue - purchasePrice) / purchasePrice) * 100
}

/**
 * Returns a consistent hex color for each AssetCategory.
 */
export function getAssetCategoryColor(category: AssetCategory): string {
  const colorMap: Record<AssetCategory, string> = {
    [AssetCategory.STOCKS]: '#3b82f6',       // Blue
    [AssetCategory.BONDS]: '#8b5cf6',        // Purple
    [AssetCategory.REAL_ESTATE]: '#f59e0b',  // Amber
    [AssetCategory.CRYPTO]: '#f97316',       // Orange
    [AssetCategory.CASH]: '#22c55e',         // Green
    [AssetCategory.COMMODITIES]: '#eab308',  // Yellow
    [AssetCategory.PRIVATE_EQUITY]: '#ec4899', // Pink
    [AssetCategory.ALTERNATIVE]: '#14b8a6', // Teal
    [AssetCategory.RETIREMENT]: '#06b6d4',  // Cyan
    [AssetCategory.OTHER]: '#94a3b8',       // Slate
  }
  return colorMap[category] ?? '#94a3b8'
}

/**
 * Returns a human-readable label for an AssetCategory enum value.
 */
export function getAssetCategoryLabel(category: AssetCategory): string {
  const labelMap: Record<AssetCategory, string> = {
    [AssetCategory.STOCKS]: 'Stocks',
    [AssetCategory.BONDS]: 'Bonds',
    [AssetCategory.REAL_ESTATE]: 'Real Estate',
    [AssetCategory.CRYPTO]: 'Cryptocurrency',
    [AssetCategory.CASH]: 'Cash & Equivalents',
    [AssetCategory.COMMODITIES]: 'Commodities',
    [AssetCategory.PRIVATE_EQUITY]: 'Private Equity',
    [AssetCategory.ALTERNATIVE]: 'Alternative',
    [AssetCategory.RETIREMENT]: 'Retirement',
    [AssetCategory.OTHER]: 'Other',
  }
  return labelMap[category] ?? category
}

/**
 * Truncates a string to a max length and adds ellipsis if needed.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength - 3)}...`
}
