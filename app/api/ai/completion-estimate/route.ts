import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { completionPredictor } from '@/lib/ai/completion-prediction'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to access AI features' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }

    const { taskId, priority, title, description, dueDate, labels, subtasks } = body

    // If taskId provided, fetch existing task
    let taskData: any = { priority, title, description, dueDate, labels, subtasks }
    if (taskId) {
      const existingTask = await prisma.task.findFirst({
        where: { id: taskId, userId }
      })
      if (!existingTask) {
        return NextResponse.json(
          { error: 'Not found', message: 'Task not found' },
          { status: 404 }
        )
      }
      taskData = {
        ...taskData,
        id: existingTask.id,
        priority: taskData.priority || existingTask.priority,
        title: taskData.title || existingTask.title,
        description: taskData.description || existingTask.description,
        dueDate: taskData.dueDate || existingTask.dueDate
      }
    }

    const prediction = await completionPredictor.predictCompletionTime(userId, taskData)

    return NextResponse.json({
      success: true,
      prediction
    })
  } catch (error) {
    console.error('Error predicting completion time:', error)
    return NextResponse.json(
      { error: 'Failed to predict completion', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to access AI features' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'taskId query parameter is required' },
        { status: 400 }
      )
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, userId }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Not found', message: 'Task not found' },
        { status: 404 }
      )
    }

    // Convert Prisma task to our Task type for compatibility
    const taskData = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      userId: task.userId,
      listId: task.listId,
      assignedToId: task.assignedToId
    }

    const prediction = await completionPredictor.predictCompletionTime(userId, taskData)

    return NextResponse.json({
      success: true,
      prediction
    })
  } catch (error) {
    console.error('Error fetching completion prediction:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prediction', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}