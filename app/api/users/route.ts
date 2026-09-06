import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { id } = Object.fromEntries(request.nextUrl.searchParams)

    const where: any = {}
    if (id && id === userId) {
      where.id = userId
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        tasks: {
          include: {
            list: true,
            labels: true,
          },
        },
        lists: true,
        labels: true,
      },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}