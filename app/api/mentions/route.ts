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

    const mentions = await prisma.mention.findMany({
      where: {
        userId,
        read: false
      },
      include: {
        comment: {
          select: {
            id: true,
            content: true,
            taskId: true,
            createdAt: true,
            user: {
              select: { id: true, name: true, image: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ mentions })
  } catch (error) {
    console.error('Error fetching mentions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mentions', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    await prisma.mention.updateMany({
      where: {
        userId,
        read: false
      },
      data: { read: true }
    })

    return NextResponse.json({ message: 'Mentions marked as read' })
  } catch (error) {
    console.error('Error marking mentions as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark mentions as read', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}