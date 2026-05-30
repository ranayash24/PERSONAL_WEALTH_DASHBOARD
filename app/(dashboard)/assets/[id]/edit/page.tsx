import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { AddAssetForm } from '@/components/forms/AddAssetForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Asset',
}

interface EditAssetPageProps {
  params: { id: string }
}

export default async function EditAssetPage({ params }: EditAssetPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const asset = await db.asset.findUnique({
    where: { id: params.id },
  })

  if (!asset) notFound()

  // Verify ownership
  if (asset.userId !== session.user.id) {
    redirect('/assets')
  }

  const defaultValues = {
    name: asset.name,
    category: asset.category,
    currentValue: asset.currentValue,
    purchasePrice: asset.purchasePrice ?? undefined,
    purchaseDate: asset.purchaseDate
      ? asset.purchaseDate.toISOString().split('T')[0]
      : null,
    currency: asset.currency,
    quantity: asset.quantity ?? undefined,
    ticker: asset.ticker ?? undefined,
    location: asset.location ?? undefined,
    notes: asset.notes ?? undefined,
  }

  return (
    <div className="max-w-2xl space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/assets"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white">Edit Asset</h2>
          <p className="text-slate-400 text-sm mt-0.5">{asset.name}</p>
        </div>
      </div>

      <AddAssetForm assetId={params.id} defaultValues={defaultValues} />
    </div>
  )
}
