// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

import { getServerSession } from 'next-auth/next'
import { GET } from '@/app/api/gamification/route'
import { NextRequest } from 'next/server'

// Mock gamification
jest.mock('@/lib/gamification', () => ({
  getUserGamification: jest.fn(),
  checkAndAwardBadges: jest.fn(),
}))

import { getUserGamification, checkAndAwardBadges } from '@/lib/gamification'

describe('app/api/gamification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/gamification')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in',
      })
    })

    it('should return gamification data when authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'test@test.com',
        },
      })

      ;(getUserGamification as jest.Mock).mockResolvedValue({
        currentStreak: 5,
        longestStreak: 7,
        lastActiveDate: new Date().toISOString(),
        totalTasksCompleted: 50,
        dailyGoal: 5,
        dailyGoalProgress: 3,
        badges: ['Getting Started'],
      })

      ;(checkAndAwardBadges as jest.Mock).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/gamification')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.currentStreak).toBe(5)
      expect(body.longestStreak).toBe(7)
      expect(body.totalTasksCompleted).toBe(50)
      expect(body.dailyGoal).toBe(5)
      expect(body.dailyGoalProgress).toBe(3)
      expect(body.badges).toEqual(['Getting Started'])
      expect(body.newBadges).toEqual([])
    })

    it('should include new badges in response', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })

      ;(getUserGamification as jest.Mock).mockResolvedValue({
        currentStreak: 3,
        longestStreak: 3,
        lastActiveDate: new Date().toISOString(),
        totalTasksCompleted: 10,
        dailyGoal: 5,
        dailyGoalProgress: 3,
        badges: [],
      })

      ;(checkAndAwardBadges as jest.Mock).mockResolvedValue([
        { id: 'streak_3', name: 'Getting Started', description: '3-day streak', icon: '🔥', unlockedAt: new Date() },
      ])

      const request = new NextRequest('http://localhost:3000/api/gamification')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.newBadges).toHaveLength(1)
      expect(body.newBadges[0].name).toBe('Getting Started')
    })
  })
})
