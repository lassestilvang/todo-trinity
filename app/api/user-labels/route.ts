import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { labelQuerySchema } from '@/lib/validations/label'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

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