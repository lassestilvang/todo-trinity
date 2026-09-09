import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import webpush from 'web-push'

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@todottrinity.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to subscribe to notifications' },
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

    const { subscription } = body

    if (!subscription) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Subscription is required' },
        { status: 400 }
      )
    }

    // Store subscription in database
    await prisma.userSetting.upsert({
      where: {
        userId_key: { userId, key: 'push-subscription' }
      },
      create: {
        userId,
        key: 'push-subscription',
        value: JSON.stringify(subscription)
      },
      update: {
        value: JSON.stringify(subscription)
      }
    })

    return NextResponse.json({ message: 'Subscription saved successfully' })
  } catch (error) {
    console.error('Error saving push subscription:', error)
    return NextResponse.json(
      { error: 'Failed to save subscription', message: error instanceof Error ? error.message : 'Unknown error' },
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

    const userId = session.user.id

    // Delete subscription from database
    await prisma.userSetting.delete({
      where: {
        userId_key: { userId, key: 'push-subscription' }
      }
    })

    return NextResponse.json({ message: 'Subscription removed successfully' })
  } catch (error) {
    console.error('Error removing push subscription:', error)
    return NextResponse.json(
      { error: 'Failed to remove subscription', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}