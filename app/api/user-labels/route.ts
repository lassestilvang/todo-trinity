import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { labelQuerySchema } from '@/lib/validations/label'
import { createLabelSchema } from '@/lib/validations/label'
import z from 'zod'

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
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      skip: (validated.page - 1) * validated.limit,
      take: validated.limit,
    })

    const total = await prisma.label.count({ where: { userId } })

    return NextResponse.json({
      labels,
      meta: { total, page: validated.page, limit: validated.limit, hasMore: labels.length === validated.limit },
    })
  } catch (error) {
    console.error('Error fetching user labels:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user labels', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
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
        ...validated,
        userId,
      },
    })

    return NextResponse.json({ label }, { status: 201 })
  } catch (error) {
    console.error('Error creating user label:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', message: error.errors[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create user label', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}