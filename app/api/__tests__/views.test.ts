// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

import { getServerSession } from 'next-auth/next'
import { GET, POST, PUT, DELETE } from '@/app/api/views/route'
import { NextRequest } from 'next/server'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    view: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('app/api/views', () => {
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

      const request = new NextRequest('http://localhost:3000/api/views')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in',
      })
    })

    it('should return views when authenticated', async () => {
      ;(prisma.view.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'view-1',
          name: 'Work View',
          filters: { status: 'TODO' },
          userId: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/views')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.views).toHaveLength(1)
      expect(body.views[0].name).toBe('Work View')
    })
  })

  describe('POST', () => {
    it('should return 401 when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/views', {
        method: 'POST',
        body: JSON.stringify({ name: 'New View' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in',
      })
    })

    it('should create a view when authenticated', async () => {
      ;(prisma.view.create as jest.Mock).mockResolvedValue({
        id: 'view-1',
        name: 'New View',
        filters: { status: 'TODO' },
        userId: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      const request = new NextRequest('http://localhost:3000/api/views', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New View',
          filters: { status: 'TODO' },
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.view.name).toBe('New View')
    })
  })

  describe('PUT', () => {
    it('should update a view when authenticated', async () => {
      ;(prisma.view.update as jest.Mock).mockResolvedValue({
        id: 'view-1',
        name: 'Updated View',
        filters: { status: 'COMPLETED' },
        userId: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      const request = new NextRequest('http://localhost:3000/api/views/view-1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated View',
          filters: { status: 'COMPLETED' },
        }),
      })
      const response = await PUT(request, { params: Promise.resolve({ id: 'view-1' }) })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.view.name).toBe('Updated View')
    })
  })

  describe('DELETE', () => {
    it('should delete a view when authenticated', async () => {
      ;(prisma.view.delete as jest.Mock).mockResolvedValue({})

      const request = new NextRequest('http://localhost:3000/api/views/view-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'view-1' }) })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.message).toBe('View deleted successfully')
    })
  })
})