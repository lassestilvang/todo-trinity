import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const where: any = {}

    if (userId) {
      where.userId = parseInt(userId)
    }

    const lists = await prisma.list.findMany({
      where,
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            completed: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(lists)
  } catch (error) {
    console.error('Error fetching user lists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user lists' },
      { status: 500 }
    )
  }
}