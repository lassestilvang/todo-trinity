import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// POST /api/integrations/calendar/sync - Trigger calendar sync
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
    let body: any

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }

    const { provider, force } = body

    // Get the calendar sync record
    const sync = await prisma.calendarSync.findFirst({
      where: { userId, provider }
    })

    if (!sync) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Calendar sync not found for this provider' },
        { status: 404 }
      )
    }

    // Only allow sync if enabled or forced
    if (!sync.enabled && !force) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Calendar sync is disabled for this provider' },
        { status: 403 }
      )
    }

    // In a real implementation, this would trigger the actual sync process
    // For now, we'll just update the last sync timestamp
    const updatedSync = await prisma.calendarSync.update({
      where: { id: sync.id },
      data: {
        lastSync: new Date(),
        syncToken: force ? null : sync.syncToken, // Reset token if forced
      }
    })

    // TODO: Trigger actual calendar sync process in background

    return NextResponse.json({
      message: 'Calendar sync triggered successfully',
      sync: updatedSync
    })
  } catch (error) {
    console.error('Error triggering calendar sync:', error)
    return NextResponse.json(
      { error: 'Failed to trigger calendar sync', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT /api/integrations/calendar/sync/toggle - Enable/disable calendar sync
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to update calendar sync' },
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

    const { provider, enabled } = body

    if (provider === undefined || enabled === undefined) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'provider and enabled are required' },
        { status: 400 }
      )
    }

    const sync = await prisma.calendarSync.findFirst({
      where: { userId, provider }
    })

    if (!sync) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Calendar sync not found for this provider' },
        { status: 404 }
      )
    }

    const updatedSync = await prisma.calendarSync.update({
      where: { id: sync.id },
      data: { enabled: Boolean(enabled) }
    })

    return NextResponse.json({
      message: `Calendar sync ${enabled ? 'enabled' : 'disabled'} successfully`,
      sync: updatedSync
    })
  } catch (error) {
    console.error('Error updating calendar sync:', error)
    return NextResponse.json(
      { error: 'Failed to update calendar sync', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}