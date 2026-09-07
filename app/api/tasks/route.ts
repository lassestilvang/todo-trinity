import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  createTaskSchema,
  updateTaskSchema,
  deleteTaskSchema,
  taskQuerySchema,
} from '@/lib/validations/task'
import { broadcastTaskCreate, broadcastTaskUpdate, broadcastTaskDelete } from '@/lib/realtime'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to view tasks' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      listId: searchParams.get('listId') || undefined,
      labelId: searchParams.get('labelId') || undefined,
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      search: searchParams.get('search') || undefined,
      dateRange: searchParams.get('dateRange') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
    }

    const validated = taskQuerySchema.parse(queryParams)

    const where: any = {
      userId,
      ...(validated.listId && { listId: validated.listId }),
      ...(validated.status && { status: validated.status as any }),
      ...(validated.priority && { priority: validated.priority as any }),
      ...(validated.search && {
        OR: [
          { title: { contains: validated.search, mode: 'insensitive' } },
          { description: { contains: validated.search, mode: 'insensitive' } },
        ],
      }),
    }

    if (validated.labelId) {
      where.labels = {
        some: { id: validated.labelId },
      }
    }

    if (validated.dateRange) {
      const [start, end] = validated.dateRange.split(',')
      where.OR = where.OR || []
      where.OR.push(
        {
          dueDate: {
            gte: new Date(start),
            lte: new Date(end),
          },
        },
        {
          createdAt: {
            gte: new Date(start),
            lte: new Date(end),
          },
        }
      )
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        labels: true,
        list: true,
      },
      orderBy: {
        [validated.sortBy]: validated.sortOrder,
      },
      skip: (validated.page - 1) * validated.limit,
      take: validated.limit,
    })

    const total = await prisma.task.count({ where: Object.keys(where).length > 0 ? where : { userId } })

    return NextResponse.json({
      tasks,
      meta: {
        total,
        page: validated.page,
        limit: validated.limit,
        hasMore: tasks.length === validated.limit,
      },
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch tasks',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to create tasks' },
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

    const validated = createTaskSchema.parse(body)

    const task = await prisma.task.create({
      data: {
        title: validated.title,
        description: validated.description,
        status: validated.status as any,
        priority: validated.priority as any,
        dueDate: validated.dueDate,
        listId: validated.listId || null,
        userId,
        labels: validated.labelIds
          ? {
              connect: validated.labelIds.map((id: string) => ({ id })),
            }
          : undefined,
      },
      include: {
        labels: true,
        list: true,
      },
    })

    broadcastTaskCreate(task)

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to create tasks' },
        { status: 401 }
      )
    }
    console.error('Error creating task:', error)
    return NextResponse.json(
      {
        error: 'Failed to create task',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}