import { prisma } from '@/lib/prisma'

export interface Reward {
  id: string
  type: 'badge' | 'points' | 'level_boost' | 'feature_unlock' | 'theme'
  value: string | number | boolean
  description: string
  cost: number
  isClaimed: boolean
  isUnlocked: boolean
}

export interface UserReward {
  id: string
  userId: string
  rewardId: string
  claimedAt: string | null
  isClaimed: boolean
}

/**
 * Get available rewards in the reward store
 */
export async function getAvailableRewards(userId: string): Promise<Reward[]> {
  const pointsData = await prisma.userPoints.findUnique({
    where: { userId },
    select: { totalPoints: true },
  })

  if (!pointsData) {
    return []
  }

  const totalPoints = pointsData.totalPoints || 0

  // Standard rewards - in production this would come from DB
  const rewards: Reward[] = [
    {
      id: 'badge_streak_master',
      type: 'badge',
      value: 'Streak Master',
      description: 'Unlock special streak master badge',
      cost: 500,
      isClaimed: false,
      isUnlocked: totalPoints >= 500,
    },
    {
      id: 'points_boost',
      type: 'points',
      value: 100,
      description: 'Get 100 bonus points',
      cost: 250,
      isClaimed: false,
      isUnlocked: totalPoints >= 250,
    },
    {
      id: 'feature_custom_fields',
      type: 'feature_unlock',
      value: 'custom_fields',
      description: 'Unlock custom task fields',
      cost: 1000,
      isClaimed: false,
      isUnlocked: totalPoints >= 1000,
    },
    {
      id: 'theme_dark',
      type: 'theme',
      value: 'dark_mode',
      description: 'Theme: Dark Mode',
      cost: 300,
      isClaimed: false,
      isUnlocked: totalPoints >= 300,
    },
    {
      id: 'points_turbo',
      type: 'points',
      value: 500,
      description: 'Get 500 bonus points',
      cost: 1500,
      isClaimed: false,
      isUnlocked: totalPoints >= 1500,
    },
    {
      id: 'badge_achievement_hunter',
      type: 'badge',
      value: 'Achievement Hunter',
      description: 'Unlock achievement hunter badge',
      cost: 2000,
      isClaimed: false,
      isUnlocked: totalPoints >= 2000,
    },
  ]

  return rewards
}

/**
 * Claim a reward
 */
export async function claimReward(userId: string, rewardId: string): Promise<{ success: boolean; reward?: Reward; error?: string }> {
  const rewards = await getAvailableRewards(userId)
  const reward = rewards.find(r => r.id === rewardId)

  if (!reward) {
    return { success: false, error: 'Reward not found' }
  }

  const pointsData = await prisma.userPoints.findUnique({
    where: { userId },
    select: { totalPoints: true },
  })

  if (!pointsData) {
    return { success: false, error: 'User points not found' }
  }

  const totalPoints = pointsData.totalPoints || 0

  if (totalPoints < reward.cost) {
    return { success: false, error: 'Not enough points' }
  }

  // Deduct points
  await prisma.userPoints.update({
    where: { userId },
    data: {
      totalPoints: { decrement: reward.cost },
      currentLevelXp: { decrement: reward.cost },
      lastUpdated: new Date(),
    },
  })

  // Record the claim
  await prisma.userReward.create({
    data: {
      userId,
      rewardId,
      claimedAt: new Date(),
      isClaimed: true,
    },
  })

  return { success: true, reward }
}

/**
 * Get user's claimed rewards
 */
export async function getUserRewards(userId: string): Promise<UserReward[]> {
  return prisma.userReward.findMany({
    where: { userId },
    orderBy: { claimedAt: 'desc' },
  })
}

/**
 * Check if user has claimed a specific reward
 */
export async function hasClaimedReward(userId: string, rewardId: string): Promise<boolean> {
  const claim = await prisma.userReward.findFirst({
    where: {
      userId,
      rewardId,
      isClaimed: true,
    },
  })

  return !!claim
}

/**
 * Redeem points for a reward
 */
export async function redeemReward(userId: string, rewardId: string): Promise<{ success: boolean; error?: string; remainingPoints?: number }> {
  const result = await claimReward(userId, rewardId)

  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Failed to redeem reward',
    }
  }

  const pointsData = await prisma.userPoints.findUnique({
    where: { userId },
    select: { totalPoints: true },
  })

  const remainingPoints = pointsData?.totalPoints || 0

  return {
    success: true,
    remainingPoints,
  }
}

/**
 * Get reward catalog (all available rewards)
 */
export async function getRewardCatalog(): Promise<Reward[]> {
  // This would typically come from a database
  return [
    {
      id: 'points_small_boost',
      type: 'points',
      value: 100,
      description: '100 Bonus Points',
      cost: 100,
      isClaimed: false,
      isUnlocked: true,
    },
    {
      id: 'points_medium_boost',
      type: 'points',
      value: 500,
      description: '500 Bonus Points',
      cost: 500,
      isClaimed: false,
      isUnlocked: true,
    },
    {
      id: 'points_large_boost',
      type: 'points',
      value: 1000,
      description: '1000 Bonus Points',
      cost: 1000,
      isClaimed: false,
      isUnlocked: true,
    },
    {
      id: 'badge_completionist',
      type: 'badge',
      value: 'Completionist',
      description: 'Special badge for 100% task completion streak',
      cost: 800,
      isClaimed: false,
      isUnlocked: true,
    },
    {
      id: 'badge_overnight_owl',
      type: 'badge',
      value: 'Overnight Owl',
      description: 'Completed 10 tasks after midnight',
      cost: 600,
      isClaimed: false,
      isUnlocked: true,
    },
    {
      id: 'feature_priority_tags',
      type: 'feature_unlock',
      value: 'priority_tags',
      description: 'Unlock priority tagging system',
      cost: 1200,
      isClaimed: false,
      isUnlocked: true,
    },
  ]
}