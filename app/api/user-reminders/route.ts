import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const reminders = await prisma.task.findMany({
      where: {
        userId,
        dueDate: {
          lte: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next 24 hours
          gte: new Date(), // From now
        },
        status: { not: 'COMPLETED' },
      },
      include: {
        list: {
          select: {
            id: true,
            name: true,
          },
        },
        labels: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    })

    return NextResponse.json(reminders)
  } catch (error) {
    console.error('Error fetching user reminders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user reminders', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}