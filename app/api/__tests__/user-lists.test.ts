// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

import { getServerSession } from 'next-auth/next'
import { GET, POST } from '@/app/api/user-lists/route'
import { NextRequest } from 'next/server'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    list: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('app/api/user-lists', () => {
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

      const request = new NextRequest('http://localhost:3000/api/user-lists')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in',
      })
    })

    it('should return user lists when authenticated', async () => {
      ;(prisma.list.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'list-1',
          name: 'Work List',
          userId: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/user-lists')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.lists).toHaveLength(1)
      expect(body.lists[0].name).toBe('Work List')
    })
  })

  describe('POST', () => {
    it('should return 401 when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/user-lists', {
        method: 'POST',
        body: JSON.stringify({ name: 'New List' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in',
      })
    })

    it('should create a list when authenticated', async () => {
      ;(prisma.list.create as jest.Mock).mockResolvedValue({
        id: 'list-1',
        name: 'New List',
        userId: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      const request = new NextRequest('http://localhost:3000/api/user-lists', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New List',
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.list.name).toBe('New List')
    })
  })
})