import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const where: any = {}

    if (userId) {
      where.userId = parseInt(userId)
    }

    const reminders = await prisma.task.findMany({
      where: {
        ...where,
        reminderDate: {
          lte: new Date(),
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
        completed: false,
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
      orderBy: {
        reminderDate: 'asc',
      },
    })

    return NextResponse.json(reminders)
  } catch (error) {
    console.error('Error fetching user reminders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user reminders' },
      { status: 500 }
    )
  }
}