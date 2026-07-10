import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Pinged daily by Vercel Cron (see vercel.json) so the MongoDB Atlas free
// cluster never crosses the 60-day inactivity threshold that pauses/deletes it.
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userCount = await db.user.count()
    return NextResponse.json({
      ok: true,
      users: userCount,
      pingedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Database ping failed' },
      { status: 500 }
    )
  }
}
