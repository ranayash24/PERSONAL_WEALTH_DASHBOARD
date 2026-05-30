import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { assetSchema } from '@/lib/validators'

interface RouteParams {
  params: { id: string }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const asset = await db.asset.findUnique({
      where: { id: params.id },
      include: {
        valuations: {
          orderBy: { date: 'desc' },
          take: 12,
        },
      },
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Verify ownership
    if (asset.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ asset })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[GET /api/assets/[id]]', error)
    }
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership first
    const existingAsset = await db.asset.findUnique({
      where: { id: params.id },
      select: { userId: true, currentValue: true },
    })

    if (!existingAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    if (existingAsset.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
      const updatedAsset = await tx.asset.update({
        where: { id: params.id },
        data: {
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

      // If value changed, record new valuation
      if (currentValue !== existingAsset.currentValue) {
        await tx.valuation.create({
          data: {
            assetId: params.id,
            value: currentValue,
            date: new Date(),
            source: 'manual_update',
          },
        })
      }

      return updatedAsset
    })

    return NextResponse.json({ asset })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[PUT /api/assets/[id]]', error)
    }
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingAsset = await db.asset.findUnique({
      where: { id: params.id },
      select: { userId: true },
    })

    if (!existingAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    if (existingAsset.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.asset.delete({ where: { id: params.id } })

    return NextResponse.json({ message: 'Asset deleted successfully' })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[DELETE /api/assets/[id]]', error)
    }
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
  }
}
