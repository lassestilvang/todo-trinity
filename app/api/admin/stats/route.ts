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
    const [userCount, taskCount, listCount, labelCount, workspaceCount, activeUsers, pendingInvitations, storageUsed] =
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

    const activeUserIds = (activeUsers as any[]).map((a: any) => a.userId)
    const activeUserCount = activeUserIds.length

    // Calculate storage used (approximate)
    const allTasks = await prisma.task.findMany({
      select: { description: true },
      where: { description: { not: null } }
    })
    const totalChars = allTasks.reduce((sum, task) => sum + (task.description?.length || 0), 0)
    const storageGb = Math.round((totalChars / (1024 * 1024)) * 100) / 100 // approximate GB

    return NextResponse.json({
      stats: {
        totalUsers: userCount,
        totalTasks: taskCount,
        totalLists: listCount,
        totalLabels: labelCount,
        totalWorkspaces: workspaceCount,
        activeUsersLast7Days: activeUserCount,
        pendingInvitations: pendingInvitations,
        storageUsed: `${storageGb} GB`
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