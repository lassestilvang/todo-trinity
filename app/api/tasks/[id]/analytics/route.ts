import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { id: taskId } = await context.params

    // Verify task belongs to user
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Not found', message: 'Task not found' },
        { status: 404 }
      )
    }

    // Get subtasks completion stats
    const subtasks = await prisma.subTask.findMany({
      where: { taskId }
    })

    const subtaskCompletion = subtasks.length > 0
      ? Math.round((subtasks.filter(s => s.completed).length / subtasks.length) * 100)
      : 0

    // Get dependencies and check if blocked
    const dependencies = await prisma.taskDependency.findMany({
      where: { taskId }
    })

    const blocked = dependencies.length > 0
      ? dependencies.some(async dep => {
          const depTask = await prisma.task.findFirst({
            where: { id: dep.dependsOnId, userId }
          })
          return depTask && depTask.completedAt
        })
      : false

    // Get time to complete (for completed tasks)
    let timeToComplete = null
    if (task.completedAt && task.createdAt) {
      const created = new Date(task.createdAt)
      const completed = new Date(task.completedAt)
      timeToComplete = Math.round((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)) // days
    }

    return NextResponse.json({
      analytics: {
        taskId,
        subtaskCount: subtasks.length,
        subtaskCompletion,
        blocked,
        timeToComplete,
        priority: task.priority,
        status: task.status,
        hasDueDate: !!task.dueDate,
        overdue: task.dueDate && task.status !== 'COMPLETED' && new Date(task.dueDate) < new Date(),
        dependencyCount: dependencies.length
      }
    })
  } catch (error) {
    console.error('Error fetching task analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}