import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

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
    const searchQuery = request.nextUrl.searchParams.get('query')

    if (!searchQuery) {
      return NextResponse.json({ results: { tasks: [], lists: [], labels: [] } })
    }

    const results = await prisma.$transaction([
      prisma.task.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
          ],
        },
        include: {
          list: true,
          labels: true,
        },
      }),
      prisma.list.findMany({
        where: {
          userId,
          name: { contains: searchQuery, mode: 'insensitive' },
        },
        include: {
          tasks: {
            include: {
              labels: true,
            },
          },
        },
      }),
      prisma.label.findMany({
        where: {
          userId,
          name: { contains: searchQuery, mode: 'insensitive' },
        },
        include: {
          tasks: {
            include: {
              list: true,
            },
          },
        },
      }),
    ])

    const [tasks, lists, labels] = results

    return NextResponse.json({ results: { tasks, lists, labels } })
  } catch (error) {
    console.error('Error searching:', error)
    return NextResponse.json(
      { error: 'Failed to search', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}