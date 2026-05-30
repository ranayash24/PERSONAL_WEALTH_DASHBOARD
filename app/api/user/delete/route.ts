import { NextResponse } from 'next/server'
import { auth, signOut } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete user (cascades to assets, settings, etc.)
    await db.user.delete({
      where: { id: session.user.id },
    })

    // Sign out the user
    await signOut({ redirect: false })

    return NextResponse.json({ message: 'Account deleted successfully.' })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[DELETE /api/user/delete]', error)
    }
    return NextResponse.json({ error: 'Failed to delete account.' }, { status: 500 })
  }
}
