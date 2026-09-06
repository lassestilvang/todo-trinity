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
    const read = request.nextUrl.searchParams.get('read')

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(read !== null && { read: read === 'true' }),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }

    const { title, message, type, data } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Title and message are required' },
        { status: 400 }
      )
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: type || 'info',
        data: data || null,
        userId,
        read: false,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }

    const { id, read } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Notification ID is required' },
        { status: 400 }
      )
    }

    const notification = await prisma.notification.findUnique({ where: { id } })

    if (!notification) {
      return NextResponse.json(
        { error: 'Not found', message: 'Notification not found' },
        { status: 404 }
      )
    }

    if (notification.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to update this notification' },
        { status: 403 }
      )
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ notification: updated })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }

    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Notification ID is required' },
        { status: 400 }
      )
    }

    const notification = await prisma.notification.findUnique({ where: { id } })

    if (!notification) {
      return NextResponse.json(
        { error: 'Not found', message: 'Notification not found' },
        { status: 404 }
      )
    }

    if (notification.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to delete this notification' },
        { status: 403 }
      )
    }

    await prisma.notification.delete({ where: { id } })

    return NextResponse.json({ message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}