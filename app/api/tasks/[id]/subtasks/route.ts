import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { SubTask } from '@/src/types/index'

// GET /api/tasks/[id]/subtasks - Get all subtasks for a task
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const subtasks = await prisma.subTask.findMany({
      where: {
        taskId: params.id,
        userId: session.user.id
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ subtasks })
  } catch (error) {
    console.error('Error fetching subtasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subtasks', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/tasks/[id]/subtasks - Create a new subtask
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Title is required' },
        { status: 400 }
      )
    }

    // Verify the task belongs to the user
    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Not found', message: 'Task not found' },
        { status: 404 }
      )
    }

    const subtask = await prisma.subTask.create({
      data: {
        title,
        taskId: params.id,
        userId: session.user.id
      }
    })

    return NextResponse.json({ subtask }, { status: 201 })
  } catch (error) {
    console.error('Error creating subtask:', error)
    return NextResponse.json(
      { error: 'Failed to create subtask', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH /api/tasks/[id]/subtasks/[subTaskId] - Update a subtask
// DELETE /api/tasks/[id]/subtasks/[subTaskId] - Delete a subtask
// We'll handle these in separate files for clarity