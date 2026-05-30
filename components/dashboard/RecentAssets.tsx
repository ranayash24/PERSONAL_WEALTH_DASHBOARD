import Link from 'next/link'
import {
  formatCurrency,
  formatPercentage,
  formatRelativeTime,
  getAssetCategoryColor,
  getAssetCategoryLabel,
} from '@/lib/utils'

interface RecentAsset {
  id: string
  name: string
  category: string
  currentValue: number
  updatedAt: string
}

interface RecentAssetsProps {
  assets: RecentAsset[]
  currency: string
}

function CategoryBadge({ category }: { category: string }) {
  const color = getAssetCategoryColor(category as Parameters<typeof getAssetCategoryColor>[0])
  const label = getAssetCategoryLabel(category as Parameters<typeof getAssetCategoryLabel>[0])

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: `${color}15`,
        color: color,
        border: `1px solid ${color}30`,
      }}
    >
      {label}
    </span>
  )
}

export function RecentAssets({ assets, currency }: RecentAssetsProps) {
  if (!assets || assets.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#16213e] p-8 text-center">
        <p className="text-slate-500 text-sm font-medium">No assets yet</p>
        <p className="text-slate-600 text-xs mt-1">Add your first asset to get started</p>
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
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Asset
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Current Value
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                Last Updated
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {assets.map((asset) => {
              const color = getAssetCategoryColor(
                asset.category as Parameters<typeof getAssetCategoryColor>[0]
              )

              return (
                <tr
                  key={asset.id}
                  className="hover:bg-white/3 transition-colors duration-150 group"
                >
                  {/* Asset name + category */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          backgroundColor: `${color}20`,
                          color,
                        }}
                      >
                        {asset.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-100">{asset.name}</p>
                        <div className="mt-0.5">
                          <CategoryBadge category={asset.category} />
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Current value */}
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-slate-100">
                      {formatCurrency(asset.currentValue, currency)}
                    </p>
                  </td>

                  {/* Last updated */}
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <p className="text-sm text-slate-400">
                      {formatRelativeTime(asset.updatedAt)}
                    </p>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-white/5 flex justify-end">
        <Link
          href="/assets"
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          View all assets →
        </Link>
      </div>
    </div>
  )
}
