// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

import { getServerSession } from 'next-auth/next'
import { GET, POST } from '@/app/api/user-labels/route'
import { NextRequest } from 'next/server'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    label: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('app/api/user-labels', () => {
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

      const request = new NextRequest('http://localhost:3000/api/user-labels')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in',
      })
    })

    it('should return user labels when authenticated', async () => {
      ;(prisma.label.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'label-1',
          name: 'Work',
          color: '#ff0000',
          userId: 'user-1',
          createdAt: new Date().toISOString(),
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/user-labels')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.labels).toHaveLength(1)
      expect(body.labels[0].name).toBe('Work')
    })
  })

  describe('POST', () => {
    it('should return 401 when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/user-labels', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Label' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in',
      })
    })

    it('should create a label when authenticated', async () => {
      ;(prisma.label.create as jest.Mock).mockResolvedValue({
        id: 'label-1',
        name: 'New Label',
        color: '#000000',
        userId: 'user-1',
        createdAt: new Date().toISOString(),
      })

      const request = new NextRequest('http://localhost:3000/api/user-labels', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Label',
          color: '#000000',
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.label.name).toBe('New Label')
    })
  })
})