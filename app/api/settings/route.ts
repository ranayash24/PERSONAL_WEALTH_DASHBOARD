import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userSettingsSchema } from '@/lib/validators'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await db.userSettings.findUnique({
      where: { userId: session.user.id },
    })

    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[GET /api/settings]', error)
    }
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as unknown
    const validated = userSettingsSchema.safeParse(body)

    if (!validated.success) {
      const fieldErrors = validated.error.flatten().fieldErrors
      return NextResponse.json(
        { error: 'Validation failed', details: fieldErrors },
        { status: 400 }
      )
    }

    const settings = await db.userSettings.upsert({
      where: { userId: session.user.id },
      update: {
        ...(validated.data.currency ? { currency: validated.data.currency } : {}),
        ...(validated.data.alertThreshold !== undefined
          ? { alertThreshold: validated.data.alertThreshold }
          : {}),
      },
      create: {
        userId: session.user.id,
        currency: validated.data.currency ?? 'USD',
        alertThreshold: validated.data.alertThreshold ?? 10.0,
      },
    })

    return NextResponse.json({ settings })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[PUT /api/settings]', error)
    }
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
