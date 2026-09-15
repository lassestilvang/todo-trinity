import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get calendar sync configuration from UserSetting
    const userSetting = await prisma.userSetting.findUnique({
      where: { userId },
      select: { calendarSync: true }
    })

    if (!userSetting?.calendarSync) {
      // Return default status if no sync configured
      return NextResponse.json({
        status: 'idle',
        enabled: false,
        provider: 'google',
        lastSync: null,
        eventsSynced: 0,
        upcomingEvents: 0,
        integration: {
          id: 'google-calendar',
          name: 'Google Calendar',
          type: 'calendar',
          provider: 'google',
          color: '#4285F4',
          icon: '📅'
        }
      })
    }

    // Get recent synced events count
    const calendarSyncData = userSetting.calendarSync as any
    const lastSyncDate = calendarSyncData?.lastSync ? new Date(calendarSyncData.lastSync) : null
    const eventsSynced = lastSyncDate
      ? await prisma.activityLog.count({
          where: {
            userId,
            action: 'calendar_sync',
            createdAt: { gte: lastSyncDate }
          }
        })
      : 0

    return NextResponse.json({
      calendarSync: userSetting.calendarSync,
      events: (userSetting.calendarSync as any)?.events || [],
      integration: {
        id: 'google-calendar',
        provider: 'google',
        enabled: !!userSetting?.calendarSync,
        lastSync: lastSyncDate || null,
        eventsSynced,
        user: {
          id: userId,
          name: session.user.name || '',
          email: session.user.email || '',
        },
      },
    })
  } catch (error) {
    console.error('Error fetching calendar sync:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar sync' },
      { status: 500 }
    )
  }
}

// POST /api/integrations/calendar/sync - Update calendar sync configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams
    const provider = searchParams.get('provider') || 'google'

    const body = await request.json()
    const { events } = body

    // Update calendar sync configuration in UserSetting.calendarSync
    const userSetting = await prisma.userSetting.upsert({
      where: { userId },
      update: {
        calendarSync: {
          userId,
          provider,
          events: events || [],
          lastSync: new Date(),
        } as any
      },
      create: {
        userId,
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        notifications: true,
        emailNotifications: true,
        desktopNotifications: true,
        soundNotifications: false,
        integrations: {},
        calendarSync: {
          userId,
          provider,
          events: events || [],
          lastSync: new Date(),
        } as any
      },
    })

    return NextResponse.json({ calendarSync: userSetting.calendarSync })
  } catch (error) {
    console.error('Error updating calendar sync:', error)
    return NextResponse.json(
      { error: 'Failed to update calendar sync' },
      { status: 500 }
    )
  }
}

// DELETE /api/integrations/calendar/sync - Remove calendar sync configuration
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Remove calendar sync configuration by clearing UserSetting.calendarSync
    const userSetting = await prisma.userSetting.update({
      where: { userId },
      data: {
        calendarSync: Prisma.JsonNull,
      },
    })

    return NextResponse.json({ message: 'Calendar sync configuration removed' })
  } catch (error) {
    console.error('Error removing calendar sync:', error)
    return NextResponse.json(
      { error: 'Failed to remove calendar sync configuration' },
      { status: 500 }
    )
  }
}