// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

import { getServerSession } from 'next-auth/next'
import { GET, POST, PUT, DELETE } from '@/app/api/labels/route'
import { NextRequest } from 'next/server'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    label: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('app/api/labels', () => {
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

      const request = new NextRequest('http://localhost:3000/api/labels')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in to view labels',
      })
    })

    it('should return labels when authenticated', async () => {
      ;(prisma.label.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'label-1',
          name: 'Work',
          color: '#ff0000',
          userId: 'user-1',
          createdAt: new Date().toISOString(),
        },
      ])
      ;(prisma.label.count as jest.Mock).mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/labels')
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

      const request = new NextRequest('http://localhost:3000/api/labels', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Label' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in to create labels',
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

      const request = new NextRequest('http://localhost:3000/api/labels', {
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

  describe('PUT', () => {
    it('should update a label when authenticated', async () => {
      ;(prisma.label.findUnique as jest.Mock).mockResolvedValue({
        id: 'clx1234567890abcdef1234567890abcdef1234567890',
        userId: 'user-1',
      })
      ;(prisma.label.update as jest.Mock).mockResolvedValue({
        id: 'clx1234567890abcdef1234567890abcdef1234567890',
        name: 'Updated Label',
        color: '#ff0000',
        userId: 'user-1',
        createdAt: new Date().toISOString(),
      })

      const request = new NextRequest('http://localhost:3000/api/labels/clx1234567890abcdef1234567890abcdef1234567890', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Label' }),
      })
      const response = await PUT(request, { params: Promise.resolve({ id: 'clx1234567890abcdef1234567890abcdef1234567890' }) })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.label.name).toBe('Updated Label')
    })
  })

  describe('DELETE', () => {
    it('should delete a label when authenticated', async () => {
      ;(prisma.label.findUnique as jest.Mock).mockResolvedValue({
        id: 'clx1234567890abcdef1234567890abcdef1234567890',
        userId: 'user-1',
      })
      ;(prisma.label.delete as jest.Mock).mockResolvedValue({})

      const request = new NextRequest('http://localhost:3000/api/labels/clx1234567890abcdef1234567890abcdef1234567890', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'clx1234567890abcdef1234567890abcdef1234567890' }) })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.message).toBe('Label deleted successfully')
    })
  })
})