// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

import { getServerSession } from 'next-auth/next'
import { GET } from '@/app/api/realtime/route'
import { NextRequest } from 'next/server'

// Mock realtime
jest.mock('@/lib/realtime', () => ({
  getRecentEvents: jest.fn(),
}))

import { getRecentEvents } from '@/lib/realtime'

describe('app/api/realtime', () => {
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

      const request = new NextRequest('http://localhost:3000/api/realtime')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in',
      })
    })

    it('should return SSE stream when authenticated', async () => {
      ;(getRecentEvents as jest.Mock).mockReturnValue([])

      const request = new NextRequest('http://localhost:3000/api/realtime')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/event-stream')
      expect(response.headers.get('Cache-Control')).toBe('no-cache')
      expect(response.headers.get('Connection')).toBe('keep-alive')
    })

    it('should include missed events in the stream', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          type: 'task_created',
          task: { id: 'task-1', title: 'Test Task' },
          timestamp: Date.now(),
        },
      ]
      ;(getRecentEvents as jest.Mock).mockReturnValue(mockEvents)

      const request = new NextRequest('http://localhost:3000/api/realtime?since=1234567890')
      const response = await GET(request)

      expect(response.status).toBe(200)
      // Verify the stream was created
      expect(response.body).not.toBeNull()
    })

    it('should handle errors gracefully', async () => {
      ;(getRecentEvents as jest.Mock).mockImplementation(() => {
        throw new Error('Test error')
      })

      const request = new NextRequest('http://localhost:3000/api/realtime')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.error).toBe('Failed to establish real-time connection')
    })
  })
})