import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { tasksToCSV, tasksToPDF } from '@/lib/export-utils'

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
          dependencies: true,
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
      const csv = tasksToCSV(data.tasks as any[])
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      })
    }

    if (format === 'pdf' && resourceType === 'tasks') {
      const pdfBuffer = await tasksToPDF(data.tasks as any[])
      return new NextResponse(pdfBuffer as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}.pdf"`,
        },
      })
    }

    if (format === 'pdf') {
      // Generate PDF report for all data
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()

      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('Todo Trinity - Data Export', 105, 15, { align: 'center' })

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(128, 128, 128)
      doc.text(`Exported on: ${new Date().toLocaleString()}`, 105, 25, { align: 'center' })

      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.5)
      doc.line(10, 30, 200, 30)

      let y = 37
      const sections = [
        { name: 'Tasks', data: data.tasks },
        { name: 'Lists', data: data.lists },
        { name: 'Labels', data: data.labels },
        { name: 'Notifications', data: data.notifications },
        { name: 'Activity Logs', data: data.activityLogs },
      ]

      sections.forEach(section => {
        if (section.data && section.data.length > 0) {
          if (y > 200) {
            doc.addPage()
            y = 20
          }

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(14)
          doc.setTextColor(0, 0, 0)
          doc.text(`${section.name} (${section.data.length})`, 15, y)
          y += 5

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(128, 128, 128)
          section.data.slice(0, 50).forEach((item: any) => {
            if (y > 260) {
              doc.addPage()
              y = 20
            }
            const title = item.title || item.name || item.action || item.id
            doc.text(`- ${title}`, 20, y)
            y += 4
          })
          y += 3
        }
      })

      const pdfBytes = doc.output('arraybuffer')
      const buffer = Buffer.from(pdfBytes)
      return new NextResponse(buffer as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}.pdf"`,
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