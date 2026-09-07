// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

import { getServerSession } from 'next-auth/next'
import { GET } from '@/app/api/search/route'
import { NextRequest } from 'next/server'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    task: {
      findMany: jest.fn(),
    },
    list: {
      findMany: jest.fn(),
    },
    label: {
      findMany: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('app/api/search', () => {
  const mockSession = {
    user: {
      id: 'user-1',
      email: 'test@test.com',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
  })

  describe('GET', () => {
    it('should return 401 when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/search?q=test')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in',
      })
    })

    it('should return search results when authenticated', async () => {
      ;(prisma.task.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'task-1',
          title: 'Test Task',
          description: 'Test Description',
          status: 'PENDING',
          priority: 'HIGH',
          dueDate: null,
          listId: 'list-1',
          userId: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          labels: [],
          list: { id: 'list-1', name: 'List 1' },
        },
      ])

      ;(prisma.list.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.label.findMany as jest.Mock).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/search?q=test')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.results).toHaveLength(1)
      expect(body.results[0].title).toBe('Test Task')
    })

    it('should handle empty query', async () => {
      const request = new NextRequest('http://localhost:3000/api/search')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.results).toEqual([])
    })

    it('should handle errors gracefully', async () => {
      ;(prisma.task.findMany as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/search?q=test')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.error).toBe('Failed to search')
    })
  })
})