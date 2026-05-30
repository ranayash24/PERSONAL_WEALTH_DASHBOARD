import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import type { AssetCategory } from '@prisma/client'

const VALID_CATEGORIES: AssetCategory[] = [
  'STOCKS', 'BONDS', 'REAL_ESTATE', 'CRYPTO', 'CASH',
  'COMMODITIES', 'PRIVATE_EQUITY', 'ALTERNATIVE', 'RETIREMENT', 'OTHER',
]

interface CsvRow {
  name?: string
  category?: string
  currentValue?: string | number
  purchasePrice?: string | number
  purchaseDate?: string
  currency?: string
  quantity?: string | number
  ticker?: string
  location?: string
  notes?: string
}

function parseCategory(value: string | undefined): AssetCategory {
  if (!value) return 'OTHER'
  const normalized = value.trim().toUpperCase().replace(/[- ]/g, '_')
  if (VALID_CATEGORIES.includes(normalized as AssetCategory)) {
    return normalized as AssetCategory
  }
  return 'OTHER'
}

function parseNumber(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === '') return null
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[,$]/g, ''))
  return isNaN(num) ? null : num
}

function parseDate(value: string | undefined): Date | null {
  if (!value || value.trim() === '') return null
  const date = new Date(value)
  return isNaN(date.getTime()) ? null : date
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as { rows: CsvRow[] }
    const { rows } = body

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 })
    }

    if (rows.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 rows per import' }, { status: 400 })
    }

    const userId = session.user.id
    const errors: string[] = []
    const assetsToCreate: Parameters<typeof db.asset.create>[0]['data'][] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // +2 because row 1 is header, arrays are 0-indexed

      const name = row.name?.trim()
      if (!name) {
        errors.push(`Row ${rowNum}: missing required field "name"`)
        continue
      }

      const currentValue = parseNumber(row.currentValue)
      if (currentValue === null || currentValue < 0) {
        errors.push(`Row ${rowNum}: invalid or missing "currentValue" for "${name}"`)
        continue
      }

      assetsToCreate.push({
        userId,
        name,
        category: parseCategory(row.category),
        currentValue,
        purchasePrice: parseNumber(row.purchasePrice) ?? undefined,
        purchaseDate: parseDate(row.purchaseDate) ?? undefined,
        currency: row.currency?.trim() || 'USD',
        quantity: parseNumber(row.quantity) ?? undefined,
        ticker: row.ticker?.trim() || undefined,
        location: row.location?.trim() || undefined,
        notes: row.notes?.trim() || undefined,
      })
    }

    if (assetsToCreate.length === 0) {
      return NextResponse.json({
        created: 0,
        errors,
        message: 'No valid rows to import',
      }, { status: 400 })
    }

    // Bulk create assets
    let created = 0
    for (const assetData of assetsToCreate) {
      await db.asset.create({ data: assetData })
      created++
    }

    // Record import log
    await db.import.create({
      data: {
        userId,
        fileName: 'csv_import',
        fileType: 'CSV',
        status: errors.length === 0 ? 'COMPLETED' : 'PARTIAL',
        rowCount: created,
        errors: errors.length > 0 ? errors.join('\n') : undefined,
      },
    })

    return NextResponse.json({ created, errors, total: rows.length })
  } catch (error) {
    console.error('[CSV Import Error]', error)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}
