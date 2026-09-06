import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

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

    const stats = await prisma.$queryRaw`
      SELECT
        COUNT(*) as totalTasks,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completedTasks,
        COUNT(*) FILTER (WHERE status != 'COMPLETED') as pendingTasks,
        COUNT(*) FILTER (WHERE priority = 'HIGH') as highPriorityTasks,
        COUNT(*) FILTER (WHERE priority = 'URGENT') as urgentTasks,
        COUNT(DISTINCT listId) as totalLists,
        COUNT(DISTINCT id) FILTER (WHERE dueDate < NOW() AND status != 'COMPLETED') as overdueTasks
      FROM tasks
      WHERE "userId" = ${userId}
    ` as any[]

    const result = stats[0]

    return NextResponse.json({
      totalTasks: parseInt(result.totalTasks),
      completedTasks: parseInt(result.completedTasks),
      pendingTasks: parseInt(result.pendingTasks),
      highPriorityTasks: parseInt(result.highPriorityTasks),
      urgentTasks: parseInt(result.urgentTasks),
      totalLists: parseInt(result.totalLists),
      overdueTasks: parseInt(result.overdueTasks),
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user stats', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}