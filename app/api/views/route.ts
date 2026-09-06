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
    const searchParams = request.nextUrl.searchParams

    const view = searchParams.get('view') || 'all'
    const listId = searchParams.get('listId')
    const labelId = searchParams.get('labelId')
    const completed = searchParams.get('completed')
    const priority = searchParams.get('priority')

    const where: any = { userId }

    if (view === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      where.dueDate = { gte: today, lt: tomorrow }
    } else if (view === 'upcoming') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)

      where.dueDate = { gte: today, lt: nextWeek }
    } else if (view === 'completed') {
      where.status = 'COMPLETED'
    } else if (view === 'overdue') {
      where.dueDate = { lt: new Date() }
      where.status = { not: 'COMPLETED' }
    }

    if (listId) {
      where.listId = listId
    }

    if (labelId) {
      where.labels = {
        some: { id: labelId },
      }
    }

    if (completed !== null) {
      where.status = completed === 'true' ? 'COMPLETED' : { not: 'COMPLETED' }
    }

    if (priority) {
      where.priority = priority
    }

    const tasks = await prisma.task.findMany({
      where,
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
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching view:', error)
    return NextResponse.json(
      { error: 'Failed to fetch view', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}