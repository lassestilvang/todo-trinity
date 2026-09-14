import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/gamification/achievements - Get all achievements for user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const achievements = await prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: [{ rarity: 'desc' }, { points: 'desc' }],
    })

    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    })

    const userAchievementIds = userAchievements.map((ua) => ua.achievementId)

    const achievementsWithStatus = achievements.map((achievement) => ({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
      points: achievement.points,
      rarity: achievement.rarity,
      criteria: achievement.criteria,
      isActive: achievement.isActive,
      isUnlocked: userAchievementIds.includes(achievement.id),
    }))

    return NextResponse.json({ achievements: achievementsWithStatus })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch achievements' },
      { status: 500 }
    )
  }
}

// POST /api/gamification/achievements/claim - Claim an achievement
export async function POST(request: Request) {
  try {
    const { userId, achievementId } = await request.json()

    if (!userId || !achievementId) {
      return NextResponse.json(
        { error: 'User ID and Achievement ID are required' },
        { status: 400 }
      )
    }

    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
    })

    if (!achievement) {
      return NextResponse.json(
        { error: 'Achievement not found' },
        { status: 404 }
      )
    }

    const userAchievement = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
    })

    if (userAchievement) {
      return NextResponse.json(
        { error: 'Achievement already claimed' },
        { status: 400 }
      )
    }

    const newUserAchievement = await prisma.userAchievement.create({
      data: {
        userId,
        achievementId,
        progress: 0,
      },
    })

    return NextResponse.json(newUserAchievement, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to claim achievement' },
      { status: 500 }
    )
  }
}

// PUT /api/gamification/achievements/update-progress - Update achievement progress
export async function PUT(request: Request) {
  try {
    const { userId, achievementId, progress } = await request.json()

    if (!userId || !achievementId || progress === undefined) {
      return NextResponse.json(
        { error: 'User ID, Achievement ID, and progress are required' },
        { status: 400 }
      )
    }

    const userAchievement = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
    })

    if (!userAchievement) {
      return NextResponse.json(
        { error: 'User achievement not found' },
        { status: 404 }
      )
    }

    const maxProgress = 100
    const newProgress = Math.max(0, Math.min(maxProgress, progress))
    const isCompleted = newProgress >= maxProgress

    const updatedUserAchievement = await prisma.userAchievement.update({
      where: {
        id: userAchievement.id,
      },
      data: {
        progress: newProgress,
      },
    })

    return NextResponse.json(updatedUserAchievement)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update achievement progress' },
      { status: 500 }
    )
  }
}