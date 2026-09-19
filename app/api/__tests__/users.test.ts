// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

import { getServerSession } from 'next-auth/next'
import { GET } from '@/app/api/users/route'
import { NextRequest } from 'next/server'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('app/api/users', () => {
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

      const request = new NextRequest('http://localhost:3000/api/users')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in',
      })
    })

    it('should return all users when authenticated', async () => {
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'user-1',
          email: 'test@test.com',
          name: 'Test User',
          image: '/test.png',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tasks: [],
          lists: [],
          labels: [],
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/users')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.users).toHaveLength(1)
      expect(body.users[0].id).toBe('user-1')
      expect(body.users[0].email).toBe('test@test.com')
    })

    it('should return filtered users when id matches userId', async () => {
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'user-1',
          email: 'test@test.com',
          name: 'Test User',
          image: '/test.png',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tasks: [],
          lists: [],
          labels: [],
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/users?id=user-1')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.users).toHaveLength(1)
      expect(body.users[0].id).toBe('user-1')
      expect(body.users[0].email).toBe('test@test.com')
    })
  })
})