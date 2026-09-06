import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from 'next-auth/next'
import { listQuerySchema } from '@/lib/validations/list'

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

    const validated = listQuerySchema.parse(queryParams)

    const lists = await prisma.list.findMany({
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

    const total = await prisma.list.count({ where: { userId } })

    return NextResponse.json({
      lists,
      meta: { total, page: validated.page, limit: validated.limit, hasMore: lists.length === validated.limit },
    })
  } catch (error) {
    console.error('Error fetching user lists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user lists', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}