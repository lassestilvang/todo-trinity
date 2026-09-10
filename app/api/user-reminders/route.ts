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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const body = await request.json()
    const { type, date } = body

    if (!type) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Reminder type is required' },
        { status: 400 }
      )
    }

    // This endpoint just returns reminders based on the query
    const reminders = await prisma.task.findMany({
      where: {
        userId,
        dueDate: {
          lte: date ? new Date(date) : new Date(Date.now() + 24 * 60 * 60 * 1000),
          gte: new Date(),
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

    return NextResponse.json({ reminders })
  } catch (error) {
    console.error('Error fetching user reminders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user reminders', message: error instanceof Error ? error.message : 'Unknown error' },
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

    const body = await request.json()
    const { type, reminderId, read } = body

    // In a real app, you'd update a reminders table
    // For now, just return success
    return NextResponse.json({ message: 'Reminder marked as read' })
  } catch (error) {
    console.error('Error updating reminder:', error)
    return NextResponse.json(
      { error: 'Failed to update reminder', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id } = body

    // In a real app, you'd delete from a reminders table
    // For now, just return success
    return NextResponse.json({ message: 'Reminder deleted' })
  } catch (error) {
    console.error('Error deleting reminder:', error)
    return NextResponse.json(
      { error: 'Failed to delete reminder', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}