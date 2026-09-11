import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/integrations/calendar/sync - Get calendar sync status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to view calendar sync' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams
    const provider = searchParams.get('provider') || 'google'

    // Get calendar sync configuration
    const calendarSync = await prisma.calendarSync.findUnique({
      where: { userId_provider: { userId, provider } },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!calendarSync) {
      // Return default status if no sync configured
      return NextResponse.json({
        status: 'idle',
        enabled: false,
        provider,
        lastSync: null,
        eventsSynced: 0,
        upcomingEvents: 0,
        integration: {
          id: `${provider}-calendar`,
          name: provider === 'google' ? 'Google Calendar' : 'Outlook Calendar',
          type: 'calendar',
          provider: provider,
          color: provider === 'google' ? '#4285F4' : '#0078D4',
          icon: '📅'
        }
      })
    }

    // Get recent synced events count
    const lastSyncDate = calendarSync.lastSync ? new Date(calendarSync.lastSync) : null
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
      status: calendarSync.enabled ? 'synced' : 'idle',
      enabled: calendarSync.enabled,
      provider,
      lastSync: calendarSync.lastSync,
      eventsSynced,
      upcomingEvents: 3, // Placeholder
      integration: {
        id: `${provider}-calendar`,
        name: provider === 'google' ? 'Google Calendar' : 'Outlook Calendar',
        type: 'calendar',
        provider: provider,
        color: provider === 'google' ? '#4285F4' : '#0078D4',
        icon: '📅'
      }
    })
  } catch (error) {
    console.error('Error fetching calendar sync:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar sync', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT /api/integrations/calendar/sync - Enable/disable calendar sync
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to configure calendar sync' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    let body

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }

    const { enabled, provider } = body

    if (!provider) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Provider is required' },
        { status: 400 }
      )
    }

    const normalizedProvider = provider === 'google' || provider === 'microsoft' ? provider : 'google'

    // Upsert calendar sync configuration
    const calendarSync = await prisma.calendarSync.upsert({
      where: { userId: userId, provider: normalizedProvider },
      create: {
        userId,
        provider: normalizedProvider,
        enabled: enabled !== false, // Default to true
        lastSync: new Date().toISOString(),
        calendarId: '', // Temporary value, will be updated during auth
        syncToken: null
      },
      update: {
        enabled: enabled !== false,
        lastSync: new Date().toISOString()
      }
    })

    return NextResponse.json({
      message: `Calendar sync ${enabled ? 'enabled' : 'disabled'} for ${calendarSync.provider}`,
      calendarSync
    })
  } catch (error) {
    console.error('Error configuring calendar sync:', error)
    return NextResponse.json(
      { error: 'Failed to configure calendar sync', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function simulateCalendarSync(userId: string, provider: string) {
  // Simulate fetching events from calendar API
  const eventsFound = Math.floor(Math.random() * 20) // 0-19 events
  const tasksCreated = Math.floor(Math.random() * eventsFound) // Some become tasks

  // Create activity log entry
  await prisma.activityLog.create({
    data: {
      userId,
      action: 'calendar_sync',
      resource: 'calendar',
      resourceId: `${provider}_sync`,
      details: JSON.stringify({ eventsFound, tasksCreated, provider }),
      ipAddress: null,
      userAgent: null
    }
  })

  return {
    eventsFound,
    tasksCreated,
    syncedEvents: await prisma.activityLog.count({
      where: { userId, action: 'calendar_sync' }
    })
  }
}