import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { updatePasswordSchema } from '@/lib/validators'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as unknown
    const validated = updatePasswordSchema.safeParse(body)

    if (!validated.success) {
      const fieldErrors = validated.error.flatten().fieldErrors
      const firstError = Object.values(fieldErrors)[0]?.[0] ?? 'Invalid input'
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    const { currentPassword, newPassword } = validated.data

    // Get current password hash
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    })

    if (!user?.password) {
      return NextResponse.json(
        { error: 'Cannot change password for this account type.' },
        { status: 400 }
      )
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password)
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Current password is incorrect.' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password
    await db.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ message: 'Password updated successfully.' })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[POST /api/auth/change-password]', error)
    }
    return NextResponse.json({ error: 'Failed to update password.' }, { status: 500 })
  }
}
