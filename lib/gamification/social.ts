import { prisma } from '@/lib/prisma'

export interface UserShare {
  id: string
  userId: string
  type: 'achievement_unlock' | 'milestone' | 'challenge_win' | 'badge_earned'
  message: string
  data?: any
  postedAt: string
  platform?: 'twitter' | 'linkedin' | 'discord' | 'facebook'
}

export interface SocialActivity {
  id: string
  userId: string
  type: 'task_completed' | 'achievement_unlocked' | 'challenge_won' | 'streak_milestone'
  title: string
  description?: string
  createdAt: string
  metadata?: any
}

export interface ShareResult {
  success: boolean
  url?: string
  message?: string
  error?: string
}

/**
 * Record a social activity
 */
export async function recordSocialActivity(
  userId: string,
  type: 'task_completed' | 'achievement_unlocked' | 'challenge_won' | 'streak_milestone',
  title: string,
  description?: string,
  metadata?: any
): Promise<void> {
  await prisma.socialActivity.create({
    data: {
      userId,
      type,
      title,
      description,
      createdAt: new Date().toISOString(),
      metadata,
    },
  })
}

/**
 * Record a user share
 */
export async function recordUserShare(
  userId: string,
  type: 'achievement_unlock' | 'milestone' | 'challenge_win' | 'badge_earned',
  message: string,
  platform?: 'twitter' | 'linkedin' | 'discord' | 'facebook'
): Promise<void> {
  await prisma.userShare.create({
    data: {
      userId,
      type,
      message,
      platform,
      postedAt: new Date().toISOString(),
    },
  })
}

/**
 * Get user's social activities
 */
export async function getUserSocialActivities(
  userId: string,
  limit?: number
): Promise<SocialActivity[]> {
  const activities = await prisma.socialActivity.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit || 20,
  })

  return activities.map(a => ({
    id: a.id,
    userId: a.userId,
    type: a.type,
    title: a.title,
    description: a.description,
    createdAt: a.createdAt,
    metadata: a.metadata,
  }))
}

/**
 * Get user's shares
 */
export async function getUserShares(userId: string, limit?: number): Promise<UserShare[]> {
  const shares = await prisma.userShare.findMany({
    where: { userId },
    orderBy: { postedAt: 'desc' },
    take: limit || 20,
  })

  return shares.map(s => ({
    id: s.id,
    userId: s.userId,
    type: s.type,
    message: s.message,
    postedAt: s.postedAt,
    platform: s.platform,
  }))
}

/**
 * Get global trending activities (for leaderboards)
 */
export async function getTrendingActivities(
  type: 'task_completed' | 'achievement_unlocked' | 'challenge_won' | 'streak_milestone',
  limit: number = 10
): Promise<SocialActivity[]> {
  // Get top users for this activity type
  const activities = await prisma.socialActivity.findMany({
    where: { type },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return activities.map(a => ({
    id: a.id,
    userId: a.userId,
    type: a.type,
    title: a.title,
    description: a.description,
    createdAt: a.createdAt,
    metadata: a.metadata,
  }))
}

/**
 * Get leaderboard participants (users with highest scores)
 */
export async function getLeaderboardParticipants(
  period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time',
  limit: number = 10
): Promise<Array<{ userId: string; score: number; rank: number }>> {
  const now = new Date()
  let startDate: Date

  if (period === 'daily') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (period === 'weekly') {
    const day = now.getDay()
    const diffToMonday = day === 0 ? -6 : 1 - day
    startDate = new Date(now.getTime() + diffToMonday * 86400000)
    startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
  } else if (period === 'monthly') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  } else {
    startDate = new Date(0)
  }

  const activities = await prisma.socialActivity.findMany({
    where: { createdAt: { gte: startDate } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  // Rank by activity count per user
  const userScores = new Map<string, number>()
  for (const activity of activities) {
    const current = userScores.get(activity.userId) || 0
    userScores.set(activity.userId, current + 1)
  }

  const ranked = Array.from(userScores.entries())
    .sort((a, b) => b[1] - a[1])
    .map((user, index) => ({
      userId: user[0],
      score: user[1],
      rank: index + 1,
    }))

  return ranked
}