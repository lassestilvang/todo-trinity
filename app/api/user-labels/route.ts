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

    const labels = await prisma.label.findMany({
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

    return NextResponse.json(labels)
  } catch (error) {
    console.error('Error fetching user labels:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user labels' },
      { status: 500 }
    )
  }
}