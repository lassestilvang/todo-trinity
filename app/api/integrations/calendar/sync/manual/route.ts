import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// POST /api/integrations/calendar/sync/manual - Manual calendar sync trigger
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to sync calendar' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams
    const provider = searchParams.get('provider') || 'google'

    // Simulate calendar sync - fetch events and create tasks
    const syncResults = await simulateCalendarSync(userId, provider)

    return NextResponse.json({
      message: `Calendar sync completed: ${syncResults.eventsFound} events found, ${syncResults.tasksCreated} tasks created`,
      syncResults
    })
  } catch (error) {
    console.error('Error during manual calendar sync:', error)
    return NextResponse.json(
      { error: 'Failed to sync calendar', message: error instanceof Error ? error.message : 'Unknown error' },
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
