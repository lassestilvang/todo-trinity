import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createTaskSchema } from '@/lib/validations/task'
import { createListSchema } from '@/lib/validations/list'
import { createLabelSchema } from '@/lib/validations/label'

// POST /api/import - Import data from JSON file
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to import data' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'No file provided' },
        { status: 400 }
      )
    }

    const text = await file.text()
    let data: any

    try {
      data = JSON.parse(text)
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON', message: 'File must contain valid JSON' },
        { status: 400 }
      )
    }

    const results = {
      tasks: { created: 0, skipped: 0, errors: [] as string[] },
      lists: { created: 0, skipped: 0, errors: [] as string[] },
      labels: { created: 0, skipped: 0, errors: [] as string[] },
    }

    // Import lists first (tasks may reference them)
    if (data.lists && Array.isArray(data.lists)) {
      for (const listData of data.lists) {
        try {
          const existing = await prisma.list.findFirst({
            where: { userId, name: listData.name }
          })

          if (existing) {
            results.lists.skipped++
            continue
          }

          await prisma.list.create({
            data: {
              name: listData.name,
              color: listData.color || '',
              icon: listData.icon || '',
              userId,
            }
          })
          results.lists.created++
        } catch (error) {
          results.lists.errors.push(`Failed to import list ${listData.name}: ${error}`)
        }
      }
    }

    // Import labels
    if (data.labels && Array.isArray(data.labels)) {
      for (const labelData of data.labels) {
        try {
          const existing = await prisma.label.findFirst({
            where: { userId, name: labelData.name }
          })

          if (existing) {
            results.labels.skipped++
            continue
          }

          await prisma.label.create({
            data: {
              name: labelData.name,
              color: labelData.color || '',
              userId,
            }
          })
          results.labels.created++
        } catch (error) {
          results.labels.errors.push(`Failed to import label ${labelData.name}: ${error}`)
        }
      }
    }

    // Import tasks
    if (data.tasks && Array.isArray(data.tasks)) {
      for (const taskData of data.tasks) {
        try {
          // Check for duplicate
          const existing = await prisma.task.findFirst({
            where: {
              userId,
              title: taskData.title,
              ...(taskData.list?.name && { list: { name: taskData.list.name } })
            }
          })

          if (existing) {
            results.tasks.skipped++
            continue
          }

          // Find or create list
          let listId = taskData.listId
          if (taskData.list?.name) {
            const list = await prisma.list.findFirst({
              where: { userId, name: taskData.list.name }
            })
            if (list) listId = list.id
          }

          // Find labels
          let labelIds: string[] = []
          if (taskData.labels && Array.isArray(taskData.labels)) {
            const labels = await prisma.label.findMany({
              where: {
                userId,
                name: { in: taskData.labels.map((l: any) => l.name || l) }
              }
            })
            labelIds = labels.map(l => l.id)
          }

          // Create task
          await prisma.task.create({
            data: {
              title: taskData.title,
              description: taskData.description,
              status: taskData.status || 'TODO',
              priority: taskData.priority || 'NORMAL',
              dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
              userId,
              listId,
              labels: labelIds.length > 0 ? { connect: labelIds.map(id => ({ id })) } : undefined,
            }
          })
          results.tasks.created++
        } catch (error) {
          results.tasks.errors.push(`Failed to import task ${taskData.title}: ${error}`)
        }
      }
    }

    return NextResponse.json({
      message: 'Import completed',
      results,
    })
  } catch (error) {
    console.error('Error importing data:', error)
    return NextResponse.json(
      { error: 'Failed to import data', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}