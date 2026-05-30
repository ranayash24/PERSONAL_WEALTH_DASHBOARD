import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { assetSchema } from '@/lib/validators'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const assets = await db.asset.findMany({
      where: {
        userId: session.user.id,
        ...(category ? { category: category as never } : {}),
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
      include: {
        valuations: {
          orderBy: { date: 'desc' },
          take: 2,
        },
      },
    })

    return NextResponse.json({ assets })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[GET /api/assets]', error)
    }
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as unknown
    const validated = assetSchema.safeParse(body)

    if (!validated.success) {
      const fieldErrors = validated.error.flatten().fieldErrors
      return NextResponse.json(
        { error: 'Validation failed', details: fieldErrors },
        { status: 400 }
      )
    }

    const {
      name,
      category,
      currentValue,
      purchasePrice,
      purchaseDate,
      currency,
      quantity,
      ticker,
      location,
      notes,
    } = validated.data

    const asset = await db.$transaction(async (tx) => {
      const newAsset = await tx.asset.create({
        data: {
          userId: session.user.id,
          name: name.trim(),
          category,
          currentValue,
          purchasePrice: purchasePrice ?? null,
          purchaseDate: purchaseDate ?? null,
          currency: currency ?? 'USD',
          quantity: quantity ?? null,
          ticker: ticker?.trim().toUpperCase() ?? null,
          location: location?.trim() ?? null,
          notes: notes?.trim() ?? null,
        },
      })

      // Create initial valuation record
      await tx.valuation.create({
        data: {
          assetId: newAsset.id,
          value: currentValue,
          date: new Date(),
          source: 'manual',
        },
      })

      return newAsset
    })

    return NextResponse.json({ asset }, { status: 201 })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[POST /api/assets]', error)
    }
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 })
  }
}
