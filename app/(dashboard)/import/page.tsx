import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { CsvImporter } from '@/components/import/CsvImporter'
import { FileSpreadsheet, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Import Data',
}

export const dynamic = 'force-dynamic'

export default async function ImportPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const recentImports = await db.import.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Import Data</h2>
          <p className="text-slate-400 text-sm mt-1">Bulk import your portfolio from a CSV file</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
          <FileSpreadsheet className="w-4 h-4" />
          CSV Import Live
        </div>
      </div>

      {/* Importer */}
      <CsvImporter />

      {/* Import history */}
      {recentImports.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Recent Imports
          </h3>
          <div className="space-y-2">
            {recentImports.map((imp) => (
              <div
                key={imp.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  {imp.status === 'COMPLETED' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : imp.status === 'PARTIAL' ? (
                    <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-sm text-white font-medium">{imp.fileName}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(imp.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                    imp.status === 'COMPLETED'
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : imp.status === 'PARTIAL'
                      ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {imp.status}
                  </span>
                  {imp.rowCount != null && (
                    <p className="text-xs text-slate-500 mt-1">{imp.rowCount} assets</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
