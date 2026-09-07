import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createListSchema, updateListSchema, deleteListSchema, listQuerySchema } from '@/lib/validations/list'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to view lists' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
    }

    const validated = listQuerySchema.parse(queryParams)

    const lists = await prisma.list.findMany({
      where: { userId },
      include: {
        tasks: {
          include: {
            labels: true,
          }
        },
        user: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (validated.page - 1) * validated.limit,
      take: validated.limit,
    })

    const total = await prisma.list.count({ where: { userId } })

    return NextResponse.json({
      lists,
      meta: {
        total,
        page: validated.page,
        limit: validated.limit,
        hasMore: lists.length === validated.limit,
      },
    })
  } catch (error) {
    console.error('Error fetching lists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lists', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to create lists' },
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

    const validated = createListSchema.parse(body)

    const list = await prisma.list.create({
      data: {
        name: validated.name,
        color: validated.color,
        icon: validated.icon,
        userId,
      },
      include: {
        tasks: {
          include: {
            labels: true,
          }
        },
        user: true
      },
    })

    return NextResponse.json({ list }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to create lists' },
        { status: 401 }
      )
    }
    console.error('Error creating list:', error)
    return NextResponse.json(
      { error: 'Failed to create list', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: any }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to update lists' },
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

    const validated = updateListSchema.parse({ ...body, id })

    const list = await prisma.list.findUnique({ where: { id } })

    if (!list) {
      return NextResponse.json(
        { error: 'Not found', message: 'List not found' },
        { status: 404 }
      )
    }

    if (list.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to update this list' },
        { status: 403 }
      )
    }

    const updatedList = await prisma.list.update({
      where: { id },
      data: {
        name: validated.name,
        color: validated.color,
        icon: validated.icon,
      },
      include: {
        tasks: {
          include: {
            labels: true,
          }
        },
        user: true
      },
    })

    return NextResponse.json({ updatedList })
  } catch (error) {
    console.error('Error updating list:', error)
    return NextResponse.json(
      { error: 'Failed to update list', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: any }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to delete lists' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { id } = await params

    const list = await prisma.list.findUnique({ where: { id } })

    if (!list) {
      return NextResponse.json(
        { error: 'Not found', message: 'List not found' },
        { status: 404 }
      )
    }

    if (list.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to delete this list' },
        { status: 403 }
      )
    }

    await prisma.list.delete({ where: { id } })

    return NextResponse.json({ message: 'List deleted successfully' })
  } catch (error) {
    console.error('Error deleting list:', error)
    return NextResponse.json(
      { error: 'Failed to delete list', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}