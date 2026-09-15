import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/admin/workspaces - Get all workspaces (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to view workspaces' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { workspaceMembers: true }
    })

    const isAdmin = user?.workspaceMembers?.some(member =>
      member.role === 'ADMIN' || member.role === 'OWNER'
    )

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only admins can view workspaces' },
        { status: 403 }
      )
    }

    const workspaces = await prisma.workspace.findMany({
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              }
            }
          }
        },
        _count: {
          select: {
            tasks: true,
            lists: true,
            invitations: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ workspaces })
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workspaces', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}