import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export async function GET(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return { session, userId: session.user.id }
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return { session, userId: session.user.id }
}

export async function PUT(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return { session, userId: session.user.id }
}

export async function DELETE(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return { session, userId: session.user.id }
}

export async function verifyAuth(request: Request): Promise<{ userId: string; session: any }> {
  const { session, userId } = await auth()

  if (!userId) {
    const error = z.string().invalid('Unauthorized')
    throw error
  }

  return { userId, session }
}

export function getCurrentUserId(request: Request): string {
  const session = auth()
  return session?.user?.id || ''
}