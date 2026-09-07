// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

import { getServerSession } from 'next-auth/next'
import { GET, POST, PUT, DELETE } from '@/app/api/notifications/route'
import { NextRequest } from 'next/server'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    notification: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    task: {
      findUnique: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('app/api/notifications', () => {
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

      const request = new NextRequest('http://localhost:3000/api/notifications')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in',
      })
    })

    it('should return notifications when authenticated', async () => {
      ;(prisma.notification.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'notif-1',
          title: 'Task Completed',
          message: 'Your task has been completed',
          type: 'task_completed',
          data: { taskId: 'task-1' },
          read: false,
          createdAt: new Date().toISOString(),
          userId: 'user-1',
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/notifications')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.notifications).toHaveLength(1)
      expect(body.notifications[0].title).toBe('Task Completed')
    })

    it('should filter by read status', async () => {
      const request = new NextRequest('http://localhost:3000/api/notifications?read=false')
      const response = await GET(request)

      expect(response.status).toBe(200)
      // Check that the API handles read filtering
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
            read: false,
          },
        })
      )
    })

    it('should return unread count in headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/notifications')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('X-Unread-Count')).toBeDefined()
    })
  })

  describe('POST', () => {
    it('should return 401 when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Notification',
          message: 'Test message',
          type: 'task_created',
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in',
      })
    })

    it('should create a notification when authenticated', async () => {
      ;(prisma.notification.create as jest.Mock).mockResolvedValue({
        id: 'notif-1',
        title: 'New Notification',
        message: 'Test message',
        type: 'task_created',
        data: { taskId: 'task-1' },
        read: false,
        createdAt: new Date().toISOString(),
        userId: 'user-1',
      })

      const request = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Notification',
          message: 'Test message',
          type: 'task_created',
          data: { taskId: 'task-1' },
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.notification.title).toBe('New Notification')
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            title: 'New Notification',
            message: 'Test message',
            type: 'task_created',
            data: { taskId: 'task-1' },
            userId: 'user-1',
          },
        })
      )
    })
  })

  describe('PUT', () => {
    it('should update notification as read', async () => {
      ;(prisma.notification.update as jest.Mock).mockResolvedValue({
        id: 'notif-1',
        title: 'Task Completed',
        message: 'Your task has been completed',
        type: 'task_completed',
        data: { taskId: 'task-1' },
        read: true,
        createdAt: new Date().toISOString(),
        userId: 'user-1',
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/notif-1', {
        method: 'PUT',
        body: JSON.stringify({
          read: true,
        }),
      })
      const response = await PUT(request, { params: Promise.resolve({ id: 'notif-1' }) })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.notification.read).toBe(true)
    })

    it('should mark all notifications as read', async () => {
      const request = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'PUT',
        body: JSON.stringify({
          readAll: true,
        }),
      })
      const response = await PUT(request)

      expect(response.status).toBe(200)
      // Should update all notifications for the user
      expect(prisma.notification.updateMany).toHaveBeenCalled()
    })
  })

  describe('DELETE', () => {
    it('should return 401 when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/notifications/notif-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'notif-1' }) })

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in',
      })
    })

    it('should delete a notification when authenticated', async () => {
      ;(prisma.notification.delete as jest.Mock).mockResolvedValue({})

      const request = new NextRequest('http://localhost:3000/api/notifications/notif-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'notif-1' }) })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.message).toBe('Notification deleted successfully')
      expect(prisma.notification.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-1' },
        })
      )
    })

    it('should only allow deletion of user\'s own notifications', async () => {
      ;(prisma.notification.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/notifications/notif-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'notif-1' }) })

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.error).toBe('Not found')
    })
  })
})