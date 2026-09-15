import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/gamification/leaderboard - Get leaderboard data
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'points'
    const period = searchParams.get('period') || 'weekly'
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    let leaderboard = await prisma.leaderboard.findFirst({
      where: {
        type: type.toUpperCase() as any,
        period: period.toUpperCase() as any,
        isActive: true,
      },
      include: {
        entries: {
          take: limit,
          orderBy: { rank: 'asc' },
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
      },
    })

    if (!leaderboard) {
      // Return mock data if no leaderboard exists
      const mockLeaderboard = await generateMockLeaderboard(type, period, limit)
      return NextResponse.json({ leaderboard: mockLeaderboard })
    }

    return NextResponse.json({
      leaderboard: {
        id: leaderboard.id,
        name: leaderboard.name,
        type: leaderboard.type,
        period: leaderboard.period,
        entries: leaderboard.entries.map((entry) => {
          const userData = entry.user as any;
          return {
            id: entry.id,
            rank: entry.rank,
            score: entry.score,
            previousRank: entry.previousRank,
            user: userData,
          };
        }),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}

async function generateMockLeaderboard(type: string, period: string, limit: number) {
  const mockUsers = [
    { id: 'user1', name: 'Alice Chen', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice', score: 5420 },
    { id: 'user2', name: 'Bob Martinez', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob', score: 4890 },
    { id: 'user3', name: 'Carol Thompson', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol', score: 4210 },
    { id: 'user4', name: 'David Kim', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david', score: 3980 },
    { id: 'user5', name: 'Emma Wilson', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma', score: 3650 },
    { id: 'user6', name: 'Frank Liu', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=frank', score: 3420 },
    { id: 'user7', name: 'Grace Anderson', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=grace', score: 3120 },
    { id: 'user8', name: 'Henry Chen', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=henry', score: 2890 },
    { id: 'user9', name: 'Iris Park', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=iris', score: 2560 },
    { id: 'user10', name: 'Jack Thompson', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jack', score: 2340 },
  ]

  const sortedUsers = mockUsers
    .map((user, index) => ({
      ...user,
      score: user.score + Math.floor(Math.random() * 500) - 250,
      rank: index + 1,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((user, index) => ({ ...user, rank: index + 1 }))

  return {
    id: 'mock',
    name: `Top ${type} ${period}`,
    type: type.toUpperCase(),
    period: period.toUpperCase(),
    entries: sortedUsers,
  }
}

// POST /api/gamification/leaderboard/update - Update user's leaderboard entry
export async function POST(request: Request) {
  try {
    const { userId, type, period, score } = await request.json()

    if (!userId || !type || !period || score === undefined) {
      return NextResponse.json(
        { error: 'User ID, type, period, and score are required' },
        { status: 400 }
      )
    }

    const leaderboard = await prisma.leaderboard.upsert({
      where: {
        id: `${type}_${period}`,
      },
      create: {
        id: `${type}_${period}`,
        name: `Top ${type} ${period}`,
        type: type.toUpperCase(),
        period: period.toUpperCase(),
        isActive: true,
      },
      update: {},
    })

    // Get current rank
    const existingEntry = await prisma.leaderboardEntry.findUnique({
      where: {
        leaderboardId_userId: {
          leaderboardId: leaderboard.id,
          userId,
        },
      },
    })

    const previousRank = existingEntry?.rank

    const entry = await prisma.leaderboardEntry.upsert({
      where: {
        leaderboardId_userId: {
          leaderboardId: leaderboard.id,
          userId,
        },
      },
      create: {
        leaderboardId: leaderboard.id,
        userId,
        score,
        rank: 0, // Will be recalculated
      },
      update: {
        score,
      },
    })

    // Recalculate ranks for all entries in this leaderboard
    await recalculateRanks(leaderboard.id)

    return NextResponse.json({ success: true, entry })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update leaderboard' },
      { status: 500 }
    )
  }
}

async function recalculateRanks(leaderboardId: string) {
  const entries = await prisma.leaderboardEntry.findMany({
    where: { leaderboardId },
    orderBy: { score: 'desc' },
  })

  for (let i = 0; i < entries.length; i++) {
    const previousRank = entries[i].rank
    await prisma.leaderboardEntry.update({
      where: { id: entries[i].id },
      data: {
        rank: i + 1,
        previousRank,
      },
    })
  }
}