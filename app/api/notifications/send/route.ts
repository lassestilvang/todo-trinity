import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import webpush from 'web-push'

// Configure web-push with VAPID keys
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const privateKey = process.env.VAPID_PRIVATE_KEY || ''

if (publicKey && privateKey) {
  webpush.setVapidDetails(
    'mailto:admin@todotrinity.com',
    publicKey,
    privateKey
  )
}

// POST /api/notifications/send - Send a push notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to send notifications' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const isAdmin = session.user.role === 'admin'

    let body: any

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }

    const { title, message, userId: targetUserId, data } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Title and message are required' },
        { status: 400 }
      )
    }

    // Create notification in database for target user or self (admin)
    const targetId = targetUserId || userId
    if (!targetId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      )
    }

    // Check if target user exists
    const userExists = await prisma.user.findUnique({ where: { id: targetId } })
    if (!userExists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: 'info',
        data: data || null,
        userId: targetId,
        read: false,
      },
    })

    // Get push subscription for the user
    const setting = await prisma.userSetting.findUnique({
      where: { userId_key: { userId: targetId, key: 'push-subscription' } }
    })

    if (setting) {
      try {
        const subscription = JSON.parse(setting.value)
        const payload = JSON.stringify({
          title,
          message,
          data: {
            notificationId: notification.id,
            ...data
          }
        })

        await webpush.sendNotification(subscription, payload)
      } catch (pushError) {
        console.error('Failed to send push notification:', pushError)
        // Notification was still created in DB, so user can see it on next visit
      }
    }

    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Error sending notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}