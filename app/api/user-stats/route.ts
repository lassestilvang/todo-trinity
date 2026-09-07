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
        COUNT(DISTINCT id) FILTER (WHERE dueDate < NOW() AND status != 'COMPLETED') as overdueTasks,
        AVG(CASE WHEN status = 'COMPLETED' THEN EXTRACT(EPOCH FROM (completedAt - createdAt))/86400 END) as avgCompletionDays,
        MAX(EXTRACT(EPOCH FROM (NOW() - createdAt))/86400) as oldestTaskAge,
        MIN(EXTRACT(EPOCH FROM (NOW() - createdAt))/86400) as newestTaskAge
      FROM tasks
      WHERE "userId" = ${userId}
    ` as any[]

    const result = stats[0]

    const statusGroupBy = await prisma.task.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    })

    const statusDistribution = statusGroupBy.reduce((acc, item) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<string, number>)

    const priorityGroupBy = await prisma.task.groupBy({
      by: ['priority'],
      where: { userId },
      _count: true,
    })

    const priorityDistribution = priorityGroupBy.reduce((acc, item) => {
      acc[item.priority] = item._count
      return acc
    }, {} as Record<string, number>)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())

    const weekTasks = await prisma.task.count({
      where: {
        userId,
        createdAt: { gte: weekStart },
      },
    })

    const recentActivity = await prisma.task.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      totalTasks: parseInt(result.totalTasks),
      completedTasks: parseInt(result.completedTasks),
      pendingTasks: parseInt(result.pendingTasks),
      highPriorityTasks: parseInt(result.highPriorityTasks),
      urgentTasks: parseInt(result.urgentTasks),
      totalLists: parseInt(result.totalLists),
      overdueTasks: parseInt(result.overdueTasks),
      completionRate: result.totalTasks ? (parseInt(result.completedTasks) / parseInt(result.totalTasks)) * 100 : 0,
      averageCompletionDays: result.avgCompletionDays ? parseFloat(result.avgCompletionDays) : 0,
      oldestTaskAge: result.oldestTaskAge ? parseFloat(result.oldestTaskAge) : 0,
      statusDistribution,
      priorityDistribution,
      weekTasks,
      recentActivity,
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user stats', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}