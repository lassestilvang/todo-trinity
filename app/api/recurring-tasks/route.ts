import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import z from 'zod'

const recurringTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  schedule: z.string().min(1, 'Schedule is required'),
  isActive: z.boolean().default(true),
  taskId: z.string().cuid(),
})

// GET /api/recurring-tasks - Get user's recurring tasks
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const recurringTasks = await prisma.recurringTask.findMany({
      where: { task: { userId } },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ recurringTasks })
  } catch (error) {
    console.error('Error fetching recurring tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recurring tasks', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/recurring-tasks - Create a recurring task
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = recurringTaskSchema.parse(body)

    const userId = session.user.id

    // Verify the task belongs to the user
    const task = await prisma.task.findFirst({
      where: { id: validatedData.taskId, userId },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Not found', message: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if recurring task already exists for this task
    const existingRecurringTask = await prisma.recurringTask.findUnique({
      where: { taskId: validatedData.taskId },
    })

    if (existingRecurringTask) {
      return NextResponse.json(
        { error: 'Conflict', message: 'Recurring task already exists for this task' },
        { status: 409 }
      )
    }

    const recurringTask = await prisma.recurringTask.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        schedule: validatedData.schedule,
        isActive: validatedData.isActive,
        task: { connect: { id: validatedData.taskId } },
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
    })

    return NextResponse.json({ recurringTask }, { status: 201 })
  } catch (error) {
    console.error('Error creating recurring task:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', message: error.errors[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create recurring task', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT /api/recurring-tasks - Update a recurring task
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, title, description, schedule, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Recurring task ID is required' },
        { status: 400 }
      )
    }

    // Verify the recurring task belongs to the user
    const recurringTask = await prisma.recurringTask.findUnique({
      where: { id },
      include: { task: true },
    })

    if (!recurringTask) {
      return NextResponse.json(
        { error: 'Not found', message: 'Recurring task not found' },
        { status: 404 }
      )
    }

    if (recurringTask.task.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You can only update your own recurring tasks' },
        { status: 403 }
      )
    }

    const updatedRecurringTask = await prisma.recurringTask.update({
      where: { id },
      data: {
        title: title || undefined,
        description: description || undefined,
        schedule: schedule || undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
    })

    return NextResponse.json({ recurringTask: updatedRecurringTask })
  } catch (error) {
    console.error('Error updating recurring task:', error)
    return NextResponse.json(
      { error: 'Failed to update recurring task', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/recurring-tasks - Delete a recurring task
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Recurring task ID is required' },
        { status: 400 }
      )
    }

    // Verify the recurring task belongs to the user
    const recurringTask = await prisma.recurringTask.findUnique({
      where: { id },
      include: { task: true },
    })

    if (!recurringTask) {
      return NextResponse.json(
        { error: 'Not found', message: 'Recurring task not found' },
        { status: 404 }
      )
    }

    if (recurringTask.task.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You can only delete your own recurring tasks' },
        { status: 403 }
      )
    }

    await prisma.recurringTask.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Recurring task deleted successfully' })
  } catch (error) {
    console.error('Error deleting recurring task:', error)
    return NextResponse.json(
      { error: 'Failed to delete recurring task', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}