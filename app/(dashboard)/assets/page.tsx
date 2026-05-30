import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { AssetTable } from '@/components/dashboard/AssetTable'
import { AssetCategory } from '@prisma/client'
import { getAssetCategoryLabel } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Assets',
}

export const dynamic = 'force-dynamic'

interface AssetsPageProps {
  searchParams: {
    category?: string
    search?: string
  }
}

export default async function AssetsPage({ searchParams }: AssetsPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { category, search } = searchParams

  const [assets, settings] = await Promise.all([
    db.asset.findMany({
      where: {
        userId: session.user.id,
        ...(category && Object.values(AssetCategory).includes(category as AssetCategory)
          ? { category: category as AssetCategory }
          : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { ticker: { contains: search, mode: 'insensitive' } },
                { location: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
    }),
    db.userSettings.findUnique({ where: { userId: session.user.id } }),
  ])

  const currency = settings?.currency ?? 'USD'
  const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0)

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Assets</h2>
          <p className="text-slate-400 text-sm mt-1">
            {assets.length} asset{assets.length !== 1 ? 's' : ''} &bull; Total:{' '}
            <span className="text-white font-medium">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency,
                maximumFractionDigits: 0,
              }).format(totalValue)}
            </span>
          </p>
        </div>
        <Link href="/assets/new" className="btn-primary flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" />
          Add Asset
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <form className="flex-1" method="GET">
          <input
            name="search"
            type="text"
            placeholder="Search by name, ticker, or location..."
            defaultValue={search ?? ''}
            className="input-dark w-full"
          />
          {category && <input type="hidden" name="category" value={category} />}
        </form>

        {/* Category filter */}
        <form method="GET" className="flex gap-2">
          <select
            name="category"
            defaultValue={category ?? ''}
            className="input-dark w-full sm:w-48"
          >
            <option value="">All Categories</option>
            {Object.values(AssetCategory).map((cat) => (
              <option key={cat} value={cat}>
                {getAssetCategoryLabel(cat)}
              </option>
            ))}
          </select>
          {search && <input type="hidden" name="search" value={search} />}
          <button type="submit" className="btn-secondary whitespace-nowrap">Filter</button>
        </form>

        {/* Clear filters */}
        {(category ?? search) && (
          <Link
            href="/assets"
            className="btn-secondary flex items-center justify-center gap-2 whitespace-nowrap"
          >
            Clear filters
          </Link>
        )}
      </div>

      {/* Assets table */}
      <AssetTable assets={assets} currency={currency} />
    </div>
  )
}
