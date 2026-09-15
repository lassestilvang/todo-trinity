import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { SubTask } from '@/src/types/index'

// PATCH /api/tasks/[id]/subtasks/[subTaskId] - Update a subtask
export async function PATCH(request: Request, context: { params: Promise<{ id: string; subTaskId: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const { id, subTaskId } = await context.params
    const body = await request.json()
    const updates = body

    // Verify the subtask belongs to the user and task
    const subtask = await prisma.subTask.findFirst({
      where: {
        id: subTaskId,
        taskId: id,
      }
    })

    if (!subtask) {
      return NextResponse.json(
        { error: 'Not found', message: 'Subtask not found' },
        { status: 404 }
      )
    }

    const updatedSubtask = await prisma.subTask.update({
      where: {
        id: subTaskId
      },
      data: {
        ...updates,
        updatedAt: new Date().toISOString()
      }
    })

    return NextResponse.json({ subtask: updatedSubtask })
  } catch (error) {
    console.error('Error updating subtask:', error)
    return NextResponse.json(
      { error: 'Failed to update subtask', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/[id]/subtasks/[subTaskId] - Delete a subtask
export async function DELETE(request: Request, context: { params: Promise<{ id: string; subTaskId: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const { id, subTaskId } = await context.params

    // Verify the subtask belongs to the user and task
    const subtask = await prisma.subTask.findFirst({
      where: {
        id: subTaskId,
        taskId: id,
      }
    })

    if (!subtask) {
      return NextResponse.json(
        { error: 'Not found', message: 'Subtask not found' },
        { status: 404 }
      )
    }

    await prisma.subTask.delete({
      where: {
        id: subTaskId
      }
    })

    return NextResponse.json({ message: 'Subtask deleted successfully' })
  } catch (error) {
    console.error('Error deleting subtask:', error)
    return NextResponse.json(
      { error: 'Failed to delete subtask', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}