import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/analytics - Get advanced analytics data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to view analytics' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams

    // Parse date range parameters
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date()
    const granularity = searchParams.get('granularity') || 'weekly' // daily, weekly, monthly

    if (startDate && endDate) {
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)
    }

    // Build date filter
    const dateFilter: any = {}
    if (startDate) dateFilter.gte = startDate
    if (endDate) dateFilter.lte = endDate

    // Get task stats for the period
    const taskStats = await prisma.task.findMany({
      where: {
        userId,
        ...(startDate && endDate && {
          OR: [
            { createdAt: dateFilter },
            { updatedAt: dateFilter },
            { completedAt: dateFilter },
          ]
        })
      },
      select: {
        id: true,
        status: true,
        priority: true,
        createdAt: true,
        completedAt: true,
        dueDate: true,
        list: { select: { id: true, name: true, color: true } },
        labels: { select: { id: true, name: true, color: true } },
      }
    })

    // Get activity logs for the period
    const activityLogs = await prisma.activityLog.findMany({
      where: {
        userId,
        ...(startDate && endDate && { createdAt: dateFilter })
      },
      select: {
        action: true,
        resource: true,
        createdAt: true,
      }
    })

    // Calculate metrics
    const totalTasks = taskStats.length
    const completedTasks = taskStats.filter(t => t.status === 'COMPLETED').length
    const pendingTasks = taskStats.filter(t => t.status !== 'COMPLETED').length
    const overdueTasks = taskStats.filter(
      t => t.dueDate && t.status !== 'COMPLETED' && new Date(t.dueDate) < new Date()
    ).length

    // Completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Priority distribution
    const priorityDistribution = {
      LOW: taskStats.filter(t => t.priority === 'LOW').length,
      NORMAL: taskStats.filter(t => t.priority === 'NORMAL').length,
      HIGH: taskStats.filter(t => t.priority === 'HIGH').length,
      URGENT: taskStats.filter(t => t.priority === 'URGENT').length,
    }

    // Status distribution
    const statusDistribution = {
      TODO: taskStats.filter(t => t.status === 'TODO').length,
      IN_PROGRESS: taskStats.filter(t => t.status === 'IN_PROGRESS').length,
      COMPLETED: taskStats.filter(t => t.status === 'COMPLETED').length,
    }

    // Tasks by list
    const tasksByList = taskStats.reduce((acc: any, task) => {
      const listName = task.list?.name || 'No List'
      if (!acc[listName]) {
        acc[listName] = { count: 0, color: task.list?.color || 'gray' }
      }
      acc[listName].count++
      return acc
    }, {})

    // Productivity trend (completion rate by day/week)
    const trendMap: Record<string, { completed: number; created: number; date: string }> = {}

    taskStats.forEach(task => {
      const createdDate = new Date(task.createdAt)
      const dateKey = granularity === 'daily'
        ? createdDate.toISOString().split('T')[0]
        : granularity === 'weekly'
          ? getWeekKey(createdDate)
          : `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`

      if (!trendMap[dateKey]) {
        trendMap[dateKey] = { completed: 0, created: 0, date: dateKey }
      }
      trendMap[dateKey].created++

      if (task.status === 'COMPLETED' && task.completedAt) {
        const completedDate = new Date(task.completedAt)
        const completeKey = granularity === 'daily'
          ? completedDate.toISOString().split('T')[0]
          : granularity === 'weekly'
            ? getWeekKey(completedDate)
            : `${completedDate.getFullYear()}-${String(completedDate.getMonth() + 1).padStart(2, '0')}`

        if (trendMap[completeKey]) {
          trendMap[completeKey].completed++
        } else {
          trendMap[completeKey] = { completed: 1, created: 0, date: completeKey }
        }
      }
    })

    const trend = Object.values(trendMap)
      .sort((a: any, b: any) => a.date.localeCompare(b.date))
      .map((item: any) => ({
        date: item.date,
        completed: item.completed,
        created: item.created,
        completionRate: item.created > 0 ? Math.round((item.completed / item.created) * 100) : 0,
      }))

    // Activity summary
    const activitySummary: Record<string, number> = {}
    activityLogs.forEach(log => {
      activitySummary[log.action] = (activitySummary[log.action] || 0) + 1
    })

    // Productivity insights
    const insights: string[] = []
    if (completionRate > 80) {
      insights.push('Excellent productivity! You are completing most of your tasks.')
    } else if (completionRate < 50) {
      insights.push('Your completion rate is below 50%. Consider breaking tasks into smaller steps.')
    }

    if (overdueTasks > 0) {
      insights.push(`${overdueTasks} task(s) are currently overdue. Consider prioritizing these.`)
    }

    const highPriorityIncomplete = taskStats.filter(
      t => (t.priority === 'HIGH' || t.priority === 'URGENT') && t.status !== 'COMPLETED'
    ).length
    if (highPriorityIncomplete > 0) {
      insights.push(`${highPriorityIncomplete} high-priority task(s) are still pending.`)
    }

    // Peak productivity day/time detection
    const dayStats: Record<string, number> = {}
    const hourStats: Record<number, number> = {}

    activityLogs.forEach(log => {
      if (log.action === 'complete' || log.action === 'task_completed') {
        const date = new Date(log.createdAt)
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
        dayStats[dayName] = (dayStats[dayName] || 0) + 1
        hourStats[date.getHours()] = (hourStats[date.getHours()] || 0) + 1
      }
    })

    const peakDay = Object.entries(dayStats).reduce((a, b) => (a[1] > b[1] ? a : b))
    const peakHour = Object.entries(hourStats).reduce((a, b) => (a[1] > b[1] ? a : b))

    if (peakDay[0] && peakDay[1] > 0) {
      insights.push(`Your most productive day is ${peakDay[0]} with ${peakDay[1]} completions.`)
    }

    if (peakHour[0] && peakHour[1] > 0) {
      const hourNum = parseInt(peakHour[0])
      const hourStr = hourNum === 0 ? '12 AM' :
        hourNum === 12 ? '12 PM' :
        hourNum < 12 ? `${hourNum} AM` :
        `${hourNum - 12} PM`
      insights.push(`Your most productive time is around ${hourStr}.`)
    }

    return NextResponse.json({
      period: { startDate, endDate, granularity },
      summary: {
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completionRate,
      },
      priorityDistribution,
      statusDistribution,
      tasksByList,
      trend,
      activitySummary,
      insights,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function getWeekKey(date: Date): string {
  const year = date.getFullYear()
  const firstDayOfYear = new Date(year, 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  return `${year}-W${String(weekNumber).padStart(2, '0')}`
}