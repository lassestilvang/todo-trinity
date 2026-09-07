// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

import { getServerSession } from 'next-auth'
import { verifyAuth, getCurrentUserId, GET, POST, PUT, DELETE } from '@/lib/auth-middleware'

describe('lib/auth-middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('verifyAuth', () => {
    it('should return userId and session when authenticated', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
      }
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const result = await verifyAuth({} as Request)

      expect(result).toEqual({
        userId: 'user-123',
        session: mockSession,
      })
    })

    it('should throw Unauthorized error when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      await expect(verifyAuth({} as Request)).rejects.toThrow('Unauthorized')
    })

    it('should throw Unauthorized error when user id is missing', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {},
      })

      await expect(verifyAuth({} as Request)).rejects.toThrow('UnmountedAuthError: Unauthorized')
    })
  })

  describe('getCurrentUserId', () => {
    it('should return userId when authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: 'user-456',
        },
      })

      const userId = await getCurrentUserId({} as Request)

      expect(userId).toBe('user-456')
    })

    it('should return empty string when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const userId = await getCurrentUserId({} as Request)

      expect(userId).toBe('')
    })
  })

  describe('GET', () => {
    it('should return session and userId when authenticated', async () => {
      const mockSession = {
        user: {
          id: 'user-789',
        },
      }
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const result = await GET({} as Request)

      expect(result).toEqual({
        session: mockSession,
        userId: 'user-789',
      })
    })

    it('should return 401 response when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const result = await GET({} as Request)

      expect(result).toBeDefined()
      // Result is a NextResponse from NextResponse.json
      expect(result).toHaveProperty('status', 401)
    })
  })

  describe('POST', () => {
    it('should return session and userId when authenticated', async () => {
      const mockSession = {
        user: {
          id: 'user-111',
        },
      }
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const result = await POST({} as Request)

      expect(result).toEqual({
        session: mockSession,
        userId: 'user-111',
      })
    })
  })

  describe('PUT', () => {
    it('should return session and userId when authenticated', async () => {
      const mockSession = {
        user: {
          id: 'user-222',
        },
      }
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const result = await PUT({} as Request)

      expect(result).toEqual({
        session: mockSession,
        userId: 'user-222',
      })
    })
  })

  describe('DELETE', () => {
    it('should return session and userId when authenticated', async () => {
      const mockSession = {
        user: {
          id: 'user-333',
        },
      }
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const result = await DELETE({} as Request)

      expect(result).toEqual({
        session: mockSession,
        userId: 'user-333',
      })
    })
  })
})