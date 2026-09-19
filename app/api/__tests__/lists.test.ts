// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

import { getServerSession } from 'next-auth/next'
import { GET, PUT, DELETE } from '@/app/api/lists/route'
import { NextRequest } from 'next/server'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    list: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    task: {
      count: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('app/api/lists', () => {
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

      const request = new NextRequest('http://localhost:3000/api/lists')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in to view lists',
      })
    })

    it('should return lists when authenticated', async () => {
      ;(prisma.list.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'list-1',
          name: 'Work List',
          userId: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/lists')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.lists).toHaveLength(1)
      expect(body.lists[0].name).toBe('Work List')
    })

    it('should handle errors gracefully', async () => {
      ;(prisma.list.findMany as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/lists')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.error).toBe('Failed to fetch lists')
    })
  })

  describe('PUT', () => {
    it('should return 401 when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/lists/list-1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated List' }),
      })
      const response = await PUT(request, { params: Promise.resolve({ id: 'list-1' }) })

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in to update lists',
      })
    })

    it('should update a list when authenticated', async () => {
      ;(prisma.list.findUnique as jest.Mock).mockResolvedValue({
        id: 'clx1234567890abcdef1234567890abcdef1234567890',
        userId: 'user-1',
      })
      ;(prisma.list.update as jest.Mock).mockResolvedValue({
        id: 'clx1234567890abcdef1234567890abcdef1234567890',
        name: 'Updated List',
        userId: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      const request = new NextRequest('http://localhost:3000/api/lists/clx1234567890abcdef1234567890abcdef1234567890', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated List' }),
      })
      const response = await PUT(request, { params: Promise.resolve({ id: 'clx1234567890abcdef1234567890abcdef1234567890' }) })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.updatedList.name).toBe('Updated List')
    })
  })

  describe('DELETE', () => {
    it('should return 401 when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/lists/list-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'list-1' }) })

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in to delete lists',
      })
    })

    it('should delete a list when authenticated', async () => {
      ;(prisma.list.findUnique as jest.Mock).mockResolvedValue({
        id: 'clx1234567890abcdef1234567890abcdef1234567890',
        userId: 'user-1',
      })
      ;(prisma.list.delete as jest.Mock).mockResolvedValue({})

      const request = new NextRequest('http://localhost:3000/api/lists/clx1234567890abcdef1234567890abcdef1234567890', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'clx1234567890abcdef1234567890abcdef1234567890' }) })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.message).toBe('List deleted successfully')
    })
  })
})