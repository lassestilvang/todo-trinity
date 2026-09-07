// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

import { getServerSession } from 'next-auth/next'
import { GET, POST } from '@/app/api/suggestions/route'
import { NextRequest } from 'next/server'

// Mock suggestions
jest.mock('@/lib/suggestions', () => ({
  getTaskSuggestions: jest.fn(),
  parseNaturalLanguage: jest.fn(),
}))

import { getTaskSuggestions, parseNaturalLanguage } from '@/lib/suggestions'

describe('app/api/suggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/suggestions')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in',
      })
    })

    it('should return task suggestions when authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'test@test.com',
        },
      })

      ;(getTaskSuggestions as jest.Mock).mockResolvedValue([
        {
          title: 'Test Task',
          description: 'Test Description',
          suggestedPriority: 'HIGH',
          confidence: 0.9,
          reason: 'Test reason',
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/suggestions')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.suggestions).toHaveLength(1)
      expect(body.suggestions[0].title).toBe('Test Task')
    })
  })

  describe('POST', () => {
    it('should return 401 when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/suggestions', {
        method: 'POST',
        body: JSON.stringify({ text: 'Test task' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in',
      })
    })

    it('should parse natural language when authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'test@test.com',
        },
      })

      ;(parseNaturalLanguage as jest.Mock).mockReturnValue({
        title: 'Test task',
        description: '',
        dueDate: new Date(),
        priority: 'NORMAL',
      })

      const request = new NextRequest('http://localhost:3000/api/suggestions', {
        method: 'POST',
        body: JSON.stringify({ text: 'Test task' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.title).toBe('Test task')
      expect(body.priority).toBe('NORMAL')
    })

    it('should return 400 when text is missing', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })

      const request = new NextRequest('http://localhost:3000/api/suggestions', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('Invalid request')
    })

    it('should return 400 when parseNaturalLanguage returns null', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })

      ;(parseNaturalLanguage as jest.Mock).mockReturnValue(null)

      const request = new NextRequest('http://localhost:3000/api/suggestions', {
        method: 'POST',
        body: JSON.stringify({ text: '   ' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('Invalid request')
    })
  })
})
