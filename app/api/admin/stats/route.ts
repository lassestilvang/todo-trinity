import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/admin/stats - Get admin statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to view admin stats' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { workspaces: true }
    })

    const isAdmin = user?.workspaces?.some(member =>
      member.role === 'ADMIN' || member.role === 'OWNER'
    )

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only admins can view admin stats' },
        { status: 403 }
      )
    }

    // Get system-wide statistics
    const [userCount, taskCount, listCount, labelCount, workspaceCount, activeUsers, pendingInvitations] =
      await Promise.all([
        prisma.user.count(),
        prisma.task.count(),
        prisma.list.count(),
        prisma.label.count(),
        prisma.workspace.count(),
        prisma.activityLog.findMany({
          where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
          select: { userId: true },
          distinct: ['userId'],
        }),
        prisma.workspaceInvitation.count({ where: { accepted: false } })
      ])

    const activeUserIds = activeUsers.map((a: any) => a.userId)
    const activeUserCount = activeUserIds.length

    return NextResponse.json({
      stats: {
        totalUsers: userCount,
        totalTasks: taskCount,
        totalLists: listCount,
        totalLabels: labelCount,
        totalWorkspaces: workspaceCount,
        activeUsersLast7Days: activeUserCount,
        pendingInvitations: pendingInvitations,
      },
      activity: {
        userId: session.user.id,
        isAdmin,
      }
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin stats', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET /api/admin/users - Get all users (admin only)
export async function GET(request: NextRequest, { params }: { params: any }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to view users' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { workspaces: true }
    })

    const isAdmin = user?.workspaces?.some(member =>
      member.role === 'ADMIN' || member.role === 'OWNER'
    )

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only admins can view users' },
        { status: 403 }
      )
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tasks: true,
            lists: true,
            workspaces: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}