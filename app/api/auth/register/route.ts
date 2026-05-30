import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { registerSchema } from '@/lib/validators'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as unknown

    // Validate input
    const validated = registerSchema.safeParse(body)
    if (!validated.success) {
      const fieldErrors = validated.error.flatten().fieldErrors
      const firstError =
        Object.values(fieldErrors)[0]?.[0] ?? 'Invalid input data'
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    const { name, email, password } = validated.data

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user and settings in a transaction
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      })

      // Create default settings
      await tx.userSettings.create({
        data: {
          userId: newUser.id,
          currency: 'USD',
          alertThreshold: 10.0,
        },
      })

      return newUser
    })

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    // Don't expose internal error details
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (process.env.NODE_ENV === 'development') {
      console.error('[Register API Error]', message)
    }
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}
