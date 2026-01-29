import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') || 'all'
    const listId = searchParams.get('listId')
    const labelId = searchParams.get('labelId')
    const completed = searchParams.get('completed')
    const priority = searchParams.get('priority')

    const where: any = {}

    if (view === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      where.AND = [
        { dueDate: { gte: today } },
        { dueDate: { lt: tomorrow } },
      ]
    } else if (view === 'upcoming') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)

      where.AND = [
        { dueDate: { gte: today } },
        { dueDate: { lt: nextWeek } },
      ]
    } else if (view === 'completed') {
      where.completed = true
    } else if (view === 'overdue') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      where.AND = [
        { dueDate: { lt: today } },
        { completed: false },
      ]
    }

    if (listId) {
      where.listId = parseInt(listId)
    }

    if (labelId) {
      where.labels = {
        some: {
          id: parseInt(labelId),
        },
      }
    }

    if (completed !== null) {
      where.completed = completed === 'true'
    }

    if (priority) {
      where.priority = priority as any
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
        {
          completed: {
            asc: true,
          },
        },
        {
          priority: {
            desc: true,
          },
        },
        {
          createdAt: {
            desc: true,
          },
        },
      ],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching view:', error)
    return NextResponse.json(
      { error: 'Failed to fetch view' },
      { status: 500 }
    )
  }
}