import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateTaskSchema, deleteTaskSchema } from '@/lib/validations/task'
import { broadcastTaskUpdate, broadcastTaskDelete } from '@/lib/realtime'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to update tasks' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { id } = await params

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }

    const validated = updateTaskSchema.parse(body)

    const task = await prisma.task.update({
      where: { id },
      data: {
        title: validated.title,
        description: validated.description,
        status: validated.status,
        priority: validated.priority,
        dueDate: validated.dueDate,
        listId: validated.listId,
        ...(validated.labelIds && {
          labels: {
            set: validated.labelIds.map((id: string) => ({ id })),
          },
        }),
      },
      include: {
        labels: true,
        list: true,
      },
    })

    if (task.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to update this task' },
        { status: 403 }
      )
    }

    broadcastTaskUpdate(task)

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      {
        error: 'Failed to update task',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to delete tasks' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { id } = await params

    const task = await prisma.task.findUnique({ where: { id } })

    if (!task) {
      return NextResponse.json(
        { error: 'Not found', message: 'Task not found' },
        { status: 404 }
      )
    }

    if (task.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to delete this task' },
        { status: 403 }
      )
    }

    await prisma.task.delete({ where: { id } })
    broadcastTaskDelete(id)

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete task',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}