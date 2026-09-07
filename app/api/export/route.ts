import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/export - Export user data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to export data' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'json' // json, csv, jsonl
    const resourceType = searchParams.get('type') // tasks, lists, labels, all
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const dateFilter: any = {}
    if (dateFrom) dateFilter.gte = new Date(dateFrom)
    if (dateTo) dateFilter.lte = new Date(dateTo)

    const data: any = {}

    // Export tasks
    if (!resourceType || resourceType === 'tasks') {
      const tasks = await prisma.task.findMany({
        where: {
          userId,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        include: {
          list: true,
          labels: true,
          comments: {
            include: {
              user: true,
              replies: { include: { user: true } },
              mentions: { include: { user: true } }
            }
          },
          subtasks: true,
          taskDependencies: true,
        },
        orderBy: { createdAt: 'desc' }
      })
      data.tasks = tasks
    }

    // Export lists
    if (!resourceType || resourceType === 'lists') {
      data.lists = await prisma.list.findMany({
        where: {
          userId,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        include: {
          tasks: true,
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    // Export labels
    if (!resourceType || resourceType === 'labels') {
      data.labels = await prisma.label.findMany({
        where: {
          userId,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        include: {
          tasks: true,
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    // Export notifications
    if (!resourceType || resourceType === 'notifications') {
      data.notifications = await prisma.notification.findMany({
        where: {
          userId,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    // Export activity logs
    if (!resourceType || resourceType === 'activity') {
      data.activityLogs = await prisma.activityLog.findMany({
        where: {
          userId,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        orderBy: { createdAt: 'desc' },
        take: 1000 // Limit for export
      })
    }

    const filename = `todo-trinity-export-${new Date().toISOString().split('T')[0]}`

    if (format === 'csv' && resourceType === 'tasks') {
      const csv = await tasksToCSV(data.tasks as any[])
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      })
    }

    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}.json"`,
      },
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { error: 'Failed to export data', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function tasksToCSV(tasks: any[]): string {
  const headers = ['id', 'title', 'description', 'status', 'priority', 'dueDate', 'completedAt', 'createdAt', 'updatedAt', 'list', 'labels']
  const rows = tasks.map(task => [
    task.id,
    `"${task.title.replace(/"/g, '""')}"`,
    task.description ? `"${task.description.replace(/"/g, '""')}"` : '',
    task.status,
    task.priority,
    task.dueDate ? task.dueDate.toISOString() : '',
    task.completedAt ? task.completedAt.toISOString() : '',
    task.createdAt.toISOString(),
    task.updatedAt.toISOString(),
    task.list?.name || '',
    task.labels?.map((l: any) => l.name).join('|') || '',
  ])

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
}