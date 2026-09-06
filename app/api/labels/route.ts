import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLabelSchema, updateLabelSchema, deleteLabelSchema, labelQuerySchema } from '@/lib/validations/label'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to view labels' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
    }

    const validated = labelQuerySchema.parse(queryParams)

    const labels = await prisma.label.findMany({
      where: { userId },
      include: {
        tasks: {
          include: {
            list: true,
            user: true,
          }
        },
        user: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (validated.page - 1) * validated.limit,
      take: validated.limit,
    })

    const total = await prisma.label.count({ where: { userId } })

    return NextResponse.json({
      labels,
      meta: {
        total,
        page: validated.page,
        limit: validated.limit,
        hasMore: labels.length === validated.limit,
      },
    })
  } catch (error) {
    console.error('Error fetching labels:', error)
    return NextResponse.json(
      { error: 'Failed to fetch labels', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to create labels' },
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

    const validated = createLabelSchema.parse(body)

    const label = await prisma.label.create({
      data: {
        name: validated.name,
        color: validated.color,
        userId,
      },
      include: {
        tasks: {
          include: {
            list: true,
            user: true,
          }
        },
        user: true
      },
    })

    return NextResponse.json({ label }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to create labels' },
        { status: 401 }
      )
    }
    console.error('Error creating label:', error)
    return NextResponse.json(
      { error: 'Failed to create label', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to update labels' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { id } = params

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }

    const validated = updateLabelSchema.parse({ ...body, id })

    const label = await prisma.label.findUnique({ where: { id } })

    if (!label) {
      return NextResponse.json(
        { error: 'Not found', message: 'Label not found' },
        { status: 404 }
      )
    }

    if (label.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to update this label' },
        { status: 403 }
      )
    }

    const updatedLabel = await prisma.label.update({
      where: { id },
      data: {
        name: validated.name,
        color: validated.color,
      },
      include: {
        tasks: {
          include: {
            list: true,
            user: true,
          }
        },
        user: true
      },
    })

    return NextResponse.json({ updatedLabel })
  } catch (error) {
    console.error('Error updating label:', error)
    return NextResponse.json(
      { error: 'Failed to update label', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to delete labels' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { id } = params

    const label = await prisma.label.findUnique({ where: { id } })

    if (!label) {
      return NextResponse.json(
        { error: 'Not found', message: 'Label not found' },
        { status: 404 }
      )
    }

    if (label.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to delete this label' },
        { status: 403 }
      )
    }

    await prisma.label.delete({ where: { id } })

    return NextResponse.json({ message: 'Label deleted successfully' })
  } catch (error) {
    console.error('Error deleting label:', error)
    return NextResponse.json(
      { error: 'Failed to delete label', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}