'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  MoreHorizontal,
} from 'lucide-react'
import type { Asset } from '@prisma/client'
import {
  formatCurrency,
  formatDate,
  formatPercentage,
  getAssetCategoryColor,
  getAssetCategoryLabel,
  calculateGainLossPercent,
  cn,
} from '@/lib/utils'

type SortField = 'name' | 'category' | 'currentValue' | 'gainLoss' | 'updatedAt'
type SortDirection = 'asc' | 'desc'

interface AssetTableProps {
  assets: Asset[]
  currency?: string
}

export function AssetTable({ assets, currency = 'USD' }: AssetTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [sortField, setSortField] = useState<SortField>('updatedAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedAssets = [...assets].sort((a, b) => {
    let aVal: number | string = 0
    let bVal: number | string = 0

    switch (sortField) {
      case 'name':
        aVal = a.name.toLowerCase()
        bVal = b.name.toLowerCase()
        break
      case 'category':
        aVal = a.category
        bVal = b.category
        break
      case 'currentValue':
        aVal = a.currentValue
        bVal = b.currentValue
        break
      case 'gainLoss':
        aVal = calculateGainLossPercent(a.currentValue, a.purchasePrice) ?? -Infinity
        bVal = calculateGainLossPercent(b.currentValue, b.purchasePrice) ?? -Infinity
        break
      case 'updatedAt':
        aVal = new Date(a.updatedAt).getTime()
        bVal = new Date(b.updatedAt).getTime()
        break
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
      return
    }
    try {
      setDeletingId(id)
      const response = await fetch(`/api/assets/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json() as { error?: string }
        throw new Error(data.error ?? 'Failed to delete')
      }
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete asset')
    } finally {
      setDeletingId(null)
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
    )
  }

  if (assets.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#16213e] p-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <MoreHorizontal className="w-6 h-6 text-slate-600" />
        </div>
        <p className="text-slate-400 font-medium">No assets found</p>
        <p className="text-slate-600 text-sm mt-1">Add your first asset to get started</p>
        <Link
          href="/assets/new"
          className="inline-flex items-center gap-2 mt-4 btn-primary text-sm"
        >
          Add Asset
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#16213e] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {[
                { field: 'name' as SortField, label: 'Asset' },
                { field: 'category' as SortField, label: 'Category' },
                { field: 'currentValue' as SortField, label: 'Current Value' },
                { field: 'gainLoss' as SortField, label: 'Gain / Loss' },
                { field: 'updatedAt' as SortField, label: 'Last Updated' },
              ].map(({ field, label }) => (
                <th key={field} className="text-left px-4 py-3">
                  <button
                    onClick={() => handleSort(field)}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-300 uppercase tracking-wider transition-colors"
                  >
                    {label}
                    <SortIcon field={field} />
                  </button>
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedAssets.map((asset) => {
              const gainLossPercent = calculateGainLossPercent(
                asset.currentValue,
                asset.purchasePrice
              )
              const gainLossAbsolute = asset.purchasePrice
                ? asset.currentValue - asset.purchasePrice
                : null
              const isPositive = gainLossPercent !== null && gainLossPercent >= 0
              const categoryColor = getAssetCategoryColor(asset.category)

              return (
                <tr
                  key={asset.id}
                  className={cn(
                    'hover:bg-white/3 transition-colors duration-150',
                    deletingId === asset.id ? 'opacity-50 pointer-events-none' : '',
                    isPending ? 'opacity-75' : ''
                  )}
                >
                  {/* Asset name */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                      >
                        {asset.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-100">{asset.name}</p>
                        {asset.ticker && (
                          <p className="text-xs text-slate-500">{asset.ticker}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${categoryColor}15`,
                        color: categoryColor,
                        borderColor: `${categoryColor}30`,
                        border: '1px solid',
                      }}
                    >
                      {getAssetCategoryLabel(asset.category)}
                    </span>
                  </td>

                  {/* Current Value */}
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-slate-100">
                      {formatCurrency(asset.currentValue, asset.currency || currency)}
                    </p>
                    {asset.quantity && (
                      <p className="text-xs text-slate-500">
                        {asset.quantity.toLocaleString()} units
                      </p>
                    )}
                  </td>

                  {/* Gain/Loss */}
                  <td className="px-4 py-3.5">
                    {gainLossPercent !== null && gainLossAbsolute !== null ? (
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            isPositive ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {formatCurrency(gainLossAbsolute, asset.currency || currency)}
                        </p>
                        <p
                          className={`text-xs ${
                            isPositive ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {formatPercentage(gainLossPercent)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-600">—</span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-slate-400">{formatDate(asset.updatedAt)}</p>
                    {asset.purchaseDate && (
                      <p className="text-xs text-slate-600">
                        Purchased {formatDate(asset.purchaseDate)}
                      </p>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenMenuId(openMenuId === asset.id ? null : asset.id)
                        }
                        className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {openMenuId === asset.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 top-8 w-40 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden">
                            <Link
                              href={`/assets/${asset.id}/edit`}
                              onClick={() => setOpenMenuId(null)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Edit
                            </Link>
                            <button
                              onClick={() => {
                                setOpenMenuId(null)
                                void handleDelete(asset.id)
                              }}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full text-left"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
