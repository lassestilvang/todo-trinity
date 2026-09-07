// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    task: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma'
import { getUserGamification, checkAndAwardBadges } from '@/lib/gamification'
import type { User } from '@/src/types/index'

describe('lib/gamification', () => {
  const mockUserId = 'test-user-id'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserGamification', () => {
    it('should return streak info with no tasks', async () => {
      (prisma.task.findMany as jest.Mock).mockResolvedValue([])

      const result = await getUserGamification(mockUserId)

      expect(result).toEqual({
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        totalTasksCompleted: 0,
        dailyGoal: 5,
        dailyGoalProgress: 0,
        badges: [],
      })
    })

    it('should calculate current streak correctly', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const twoDaysAgo = new Date(today)
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      // Tasks completed today and yesterday, but not two days ago
      (prisma.task.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'task-1',
          completedAt: today.toISOString(),
          createdAt: today.toISOString(),
        },
        {
          id: 'task-2',
          completedAt: yesterday.toISOString(),
          createdAt: yesterday.toISOString(),
        },
      ])

      const result = await getUserGamification(mockUserId)

      expect(result.currentStreak).toBe(2)
      expect(result.longestStreak).toBe(2)
      expect(result.totalTasksCompleted).toBe(2)
      expect(result.badges).toContain('Getting Started') // 3-day streak not reached yet
    })

    it('should award badges based on streak', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const dates = []
      // Create tasks for last 8 days
      for (let i = 0; i < 8; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        dates.push(date.toISOString())
      }

      (prisma.task.findMany as jest.Mock).mockResolvedValue(
        dates.map((date, index) => ({
          id: `task-${index}`,
          completedAt: date,
          createdAt: date,
        }))
      )

      const result = await getUserGamification(mockUserId)

      expect(result.currentStreak).toBe(8)
      expect(result.badges).toEqual([
        'Getting Started', // 3-day streak
        'Weekly Warrior', // 7-day streak
      ])
      // Monthly Master (30-day) not awarded yet
    })

    it('should handle gaps in completion', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const threeDaysAgo = new Date(today)
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

      // Tasks completed today and yesterday, but gap of 2 days, then another task
      (prisma.task.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'task-1',
          completedAt: today.toISOString(),
          createdAt: today.toISOString(),
        },
        {
          id: 'task-2',
          completedAt: yesterday.toISOString(),
          createdAt: yesterday.toISOString(),
        },
        {
          id: 'task-3',
          completedAt: threeDaysAgo.toISOString(),
          createdAt: threeDaysAgo.toISOString(),
        },
      ])

      const result = await getUserGamification(mockUserId)

      expect(result.currentStreak).toBe(2) // Today + yesterday
      expect(result.longestStreak).toBe(2) // Still 2, as the gap breaks the streak
      expect(result.totalTasksCompleted).toBe(3)
    })
  })

  describe('checkAndAwardBadges', () => {
    it('should return new badges when streak reaches thresholds', async () => {
      // Mock getUserGamification to return specific values
      jest.spyOn(require('@/lib/gamification'), 'getUserGamification').mockResolvedValue({
        currentStreak: 3,
        longestStreak: 3,
        lastActiveDate: new Date().toISOString(),
        totalTasksCompleted: 10,
        dailyGoal: 5,
        dailyGoalProgress: 3,
        badges: [], // No badges yet
      })

      const result = await checkAndAwardBadges(mockUserId)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'streak_3',
        name: 'Getting Started',
        description: '3-day streak',
        icon: '🔥',
      })
    })

    it('should return empty array when no new badges', async () => {
      jest.spyOn(require('@/lib/gamification'), 'getUserGamification').mockResolvedValue({
        currentStreak: 2, // Below 3-day threshold
        longestStreak: 2,
        lastActiveDate: new Date().toISOString(),
        totalTasksCompleted: 10,
        dailyGoal: 5,
        dailyGoalProgress: 2,
        badges: ['Getting Started'], // Already has this badge
      })

      const result = await checkAndAwardBadges(mockUserId)

      expect(result).toHaveLength(0)
    })
  })
})