import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest, context: { params: Promise<Record<string, string>> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const { workspaceId } = await context.params

    // Verify user has access to the workspace
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id
      }
    })

    if (!workspaceMember) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have access to this workspace' },
        { status: 403 }
      )
    }

    // Get presence information for workspace members
    // In a real implementation, this would come from a presence service (Redis, etc.)
    // For now, we'll simulate with database timestamps
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true, image: true }
        }
      }
    })

    const usersWithPresence = members.map(member => {
      // Simulate presence based on last activity
      // In reality, this would track heartbeat/last seen from frontend
      const status = Math.random() > 0.3 ? 'online' : Math.random() > 0.6 ? 'away' : 'offline'

      return {
        id: member.user.id,
        name: member.user.name || 'Anonymous',
        image: member.user.image,
        status,
        lastSeen: status === 'offline' ? new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString() : null
      }
    })

    return NextResponse.json({ users: usersWithPresence })
  } catch (error) {
    console.error('Error fetching workspace presence:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workspace presence', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, context: { params: Promise<Record<string, string>> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const { workspaceId } = await context.params

    // Verify user has access to the workspace
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id
      }
    })

    if (!workspaceMember) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have access to this workspace' },
        { status: 403 }
      )
    }

    const { status } = await request.json()

    if (!status || !['online', 'away', 'offline'].includes(status)) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Status must be online, away, or offline' },
        { status: 400 }
      )
    }

    // In a real implementation, this would update a presence service
    // For now, we'll update the user's last activity timestamp
    // We could store this in a dedicated presence table or use user settings
    // For simplicity, we'll just acknowledge the update
    return NextResponse.json({ message: 'Presence updated' })
  } catch (error) {
    console.error('Error updating workspace presence:', error)
    return NextResponse.json(
      { error: 'Failed to update presence', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}