import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { auth } from '@/lib/auth'
import { AddAssetForm } from '@/components/forms/AddAssetForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Add Asset',
}

export default async function NewAssetPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

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
          <h2 className="text-2xl font-bold text-white">Add Asset</h2>
          <p className="text-slate-400 text-sm mt-0.5">Track a new asset in your portfolio</p>
        </div>
      </div>

      <AddAssetForm />
    </div>
  )
}
