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
      update: jest.fn(),
      delete: jest.fn(),
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
        message: 'You must be signed in',
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
      ;(prisma.label.update as jest.Mock).mockResolvedValue({
        id: 'label-1',
        name: 'Updated Label',
        color: '#ff0000',
        userId: 'user-1',
        createdAt: new Date().toISOString(),
      })

      const request = new NextRequest('http://localhost:3000/api/labels/label-1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Label' }),
      })
      const response = await PUT(request, { params: Promise.resolve({ id: 'label-1' }) })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.label.name).toBe('Updated Label')
    })
  })

  describe('DELETE', () => {
    it('should delete a label when authenticated', async () => {
      ;(prisma.label.delete as jest.Mock).mockResolvedValue({})

      const request = new NextRequest('http://localhost:3000/api/labels/label-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'label-1' }) })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.message).toBe('Label deleted successfully')
    })
  })
})