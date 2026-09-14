import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getRecentEvents, getUserPresence, updateUserPresence } from '@/lib/realtime'

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
    const workspaceId = request.nextUrl.searchParams.get('workspaceId') || undefined
    const since = parseInt(request.nextUrl.searchParams.get('since') || '0', 10)

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        // Send any missed events first
        const missedEvents = getRecentEvents(since, userId)
        if (missedEvents.length > 0) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'sync', events: missedEvents })}\n\n`)
          )
        }

        // Send current presence
        const currentPresence = getUserPresence(workspaceId)
        if (currentPresence.length > 0) {
          controller.enqueue(
            encoder.encode(`presence: ${JSON.stringify({ type: 'presence_update', users: currentPresence })}\n\n`)
          )
        }

        // Send heartbeat every 5 seconds
        const heartbeatInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': heartbeat\n\n'))
          } catch {
            clearInterval(heartbeatInterval)
          }
        }, 5000)

        // Cleanup on abort
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval)
          controller.close()
        })
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in realtime endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to establish real-time connection' },
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
    const { page, workspaceId } = body

    // Update user presence
    updateUserPresence(userId, page, workspaceId)

    // Broadcast user joined event
    // This will be picked up by other users subscribed to the same workspace

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating presence:', error)
    return NextResponse.json(
      { error: 'Failed to update presence' },
      { status: 500 }
    )
  }
}