// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

import { getServerSession } from 'next-auth/next'
import { GET, POST, PUT, DELETE } from '@/app/api/user-reminders/route'
import { NextRequest } from 'next/server'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    task: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('app/api/user-reminders', () => {
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

      const request = new NextRequest('http://localhost:3000/api/user-reminders')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in',
      })
    })

    it('should return reminders when authenticated', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      ;(prisma.task.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'task-1',
          title: 'Task for tomorrow',
          dueDate: tomorrow.toISOString(),
          status: 'PENDING',
          priority: 'HIGH',
          userId: 'user-1',
          createdAt: today.toISOString(),
          updatedAt: today.toISOString(),
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/user-reminders')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.reminders).toHaveLength(1)
      expect(body.reminders[0].title).toBe('Task for tomorrow')
    })

    it('should filter reminders by type', async () => {
      ;(prisma.task.findMany as jest.Mock).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/user-reminders?type=tasks')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.reminders).toEqual([])
    })

    it('should return today's reminders by default', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      ;(prisma.task.findMany as jest.Mock).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/user-reminders')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.type).toBe('tasks')
    })
  })

  describe('POST', () => {
    it('should return 401 when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/user-reminders', {
        method: 'POST',
        body: JSON.stringify({ type: 'tasks' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in',
      })
    })

    it('should fetch reminders when authenticated', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      ;(prisma.task.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'task-1',
          title: 'Task for tomorrow',
          dueDate: tomorrow.toISOString(),
          status: 'PENDING',
          priority: 'HIGH',
          userId: 'user-1',
          createdAt: today.toISOString(),
          updatedAt: today.toISOString(),
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/user-reminders', {
        method: 'POST',
        body: JSON.stringify({
          type: 'tasks',
          date: tomorrow.toISOString(),
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.reminders).toHaveLength(1)
    })

    it('should handle invalid reminder type', async () => {
      const request = new NextRequest('http://localhost:3000/api/user-reminders', {
        method: 'POST',
        body: JSON.stringify({ type: 'invalid' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('Invalid reminder type')
    })
  })

  describe('PUT', () => {
    it('should mark reminder as read when authenticated', async () => {
      ;(prisma.task.update as jest.Mock).mockResolvedValue({})

      const request = new NextRequest('http://localhost:3000/api/user-reminders', {
        method: 'PUT',
        body: JSON.stringify({
          type: 'tasks',
          reminderId: 'task-1',
          read: true,
        }),
      })
      const response = await PUT(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.message).toBe('Reminder marked as read')
    })
  })

  describe('DELETE', () => {
    it('should return 401 when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/user-reminders/reminder-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'reminder-1' }) })

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in',
      })
    })

    it('should delete reminder when authenticated', async () => {
      ;(prisma.task.update as jest.Mock).mockResolvedValue({})

      const request = new NextRequest('http://localhost:3000/api/user-reminders/reminder-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'reminder-1' }) })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.message).toBe('Reminder deleted')
    })
  })
})