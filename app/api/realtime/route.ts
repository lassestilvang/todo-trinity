import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getRecentEvents } from '@/lib/realtime'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const since = parseInt(request.nextUrl.searchParams.get('since') || '0', 10)

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        // Send any missed events first
        const missedEvents = getRecentEvents(since)
        if (missedEvents.length > 0) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'sync', events: missedEvents })}\n\n`)
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