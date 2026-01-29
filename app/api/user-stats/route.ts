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

    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as totalTasks,
        COUNT(*) FILTER (WHERE completed = true) as completedTasks,
        COUNT(*) FILTER (WHERE completed = false) as pendingTasks,
        COUNT(*) FILTER (WHERE priority = 'high') as highPriorityTasks,
        COUNT(*) FILTER (WHERE priority = 'medium') as mediumPriorityTasks,
        COUNT(*) FILTER (WHERE priority = 'low') as lowPriorityTasks,
        COUNT(DISTINCT list_id) as totalLists,
        COUNT(DISTINCT label_id) as totalLabels
      FROM task
      ${userId ? prisma.$queryRaw`WHERE user_id = ${parseInt(userId)}` : ''}
    `

    return NextResponse.json(stats[0])
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    )
  }
}