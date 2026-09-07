// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

import { getServerSession } from 'next-auth/next'
import { GET } from '@/app/api/user-stats/route'
import { NextRequest } from 'next/server'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    task: {
      groupBy: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('app/api/user-stats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/user-stats')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in',
      })
    })

    it('should return user stats when authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'test@test.com',
        },
      })

      // Mock queryRaw result
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([
        {
          totalTasks: 10,
          completedTasks: 8,
          pendingTasks: 2,
          highPriorityTasks: 2,
          urgentTasks: 1,
          totalLists: 3,
          overdueTasks: 1,
          avgCompletionDays: 2.5,
          oldestTaskAge: 100,
          newestTaskAge: 10,
        },
      ])

      // Mock groupBy results
      ;(prisma.task.groupBy as jest.Mock)
        .mockResolvedValueOnce([
          { status: 'COMPLETED', _count: 8 },
          { status: 'PENDING', _count: 2 },
        ])
        .mockResolvedValueOnce([
          { priority: 'HIGH', _count: 2 },
          { priority: 'NORMAL', _count: 8 },
        ])

      // Mock count
      ;(prisma.task.count as jest.Mock).mockResolvedValue(4)

      // Mock findMany
      ;(prisma.task.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'task-1',
          title: 'Task 1',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/user-stats')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.totalTasks).toBe(10)
      expect(body.completedTasks).toBe(8)
      expect(body.pendingTasks).toBe(2)
      expect(body.completionRate).toBe(80)
      expect(body.statusDistribution).toEqual({
        COMPLETED: 8,
        PENDING: 2,
      })
    })

    it('should handle errors gracefully', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })

      ;(prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/user-stats')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.error).toBe('Failed to fetch user stats')
    })
  })
})
