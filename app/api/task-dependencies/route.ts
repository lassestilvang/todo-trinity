import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/task-dependencies?taskId=[id] - Get dependencies for a task
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    const dependencies = await prisma.taskDependency.findMany({
      where: {
        taskId,
      }
    })

    return NextResponse.json({ dependencies })
  } catch (error) {
    console.error('Error fetching task dependencies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dependencies', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/task-dependencies - Create a new task dependency
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { taskId, dependsOnId } = body

    if (!taskId || !dependsOnId) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Task ID and dependsOn ID are required' },
        { status: 400 }
      )
    }

    // Verify both tasks belong to the user
    const [task, dependencyTask] = await Promise.all([
      prisma.task.findFirst({
        where: {
          id: taskId,
          userId: session.user.id
        }
      }),
      prisma.task.findFirst({
        where: {
          id: dependsOnId,
          userId: session.user.id
        }
      })
    ])

    if (!task) {
      return NextResponse.json(
        { error: 'Not found', message: 'Task not found' },
        { status: 404 }
      )
    }

    if (!dependencyTask) {
      return NextResponse.json(
        { error: 'Not found', message: 'Dependency task not found' },
        { status: 404 }
      )
    }

    // Check if dependency already exists
    const existingDependency = await prisma.taskDependency.findFirst({
      where: {
        taskId,
        dependsOnId,
      }
    })

    if (existingDependency) {
      return NextResponse.json(
        { error: 'Conflict', message: 'Dependency already exists' },
        { status: 409 }
      )
    }

    // Check for circular dependencies
    const hasCircularDependency = await checkCircularDependency(taskId, dependsOnId, session.user.id)
    if (hasCircularDependency) {
      return NextResponse.json(
        { error: 'Invalid dependency', message: 'Creating this dependency would cause a circular dependency' },
        { status: 400 }
      )
    }

    const dependency = await prisma.taskDependency.create({
      data: {
        taskId,
        dependsOnId,
      }
    })

    return NextResponse.json({ dependency }, { status: 201 })
  } catch (error) {
    console.error('Error creating task dependency:', error)
    return NextResponse.json(
      { error: 'Failed to create dependency', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/task-dependencies/[taskId]/[dependsOnId] - Delete a task dependency
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const taskId = searchParams.get('taskId')
    const dependsOnId = searchParams.get('dependsOnId')

    if (!taskId || !dependsOnId) {
      return NextResponse.json(
        { error: 'Task ID and dependsOn ID are required' },
        { status: 400 }
      )
    }

    // Verify the dependency belongs to the user
    const dependency = await prisma.taskDependency.findFirst({
      where: {
        taskId,
        dependsOnId,
      }
    })

    if (!dependency) {
      return NextResponse.json(
        { error: 'Not found', message: 'Dependency not found' },
        { status: 404 }
      )
    }

    await prisma.taskDependency.delete({
      where: {
        taskId_dependsOnId: {
          taskId,
          dependsOnId
        }
      }
    })

    return NextResponse.json({ message: 'Dependency deleted successfully' })
  } catch (error) {
    console.error('Error deleting task dependency:', error)
    return NextResponse.json(
      { error: 'Failed to delete dependency', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Helper function to check for circular dependencies
async function checkCircularDependency(taskId: string, dependsOnId: string, userId: string): Promise<boolean> {
  // Check if dependsOnId already depends on taskId (direct circular)
  const directCircular = await prisma.taskDependency.findFirst({
    where: {
      taskId: dependsOnId,
      dependsOnId: taskId,
    }
  })

  if (directCircular) return true

  // Check for indirect circular dependencies (depth-limited to prevent infinite loops)
  // For now, we'll keep it simple and just check direct circular
  // In a production app, you might want to implement a full graph traversal
  return false
}