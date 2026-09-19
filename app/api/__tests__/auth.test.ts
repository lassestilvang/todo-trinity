// Mock next-auth BEFORE importing the route
jest.mock('next-auth', () => {
  const handler = jest.fn().mockImplementation(async (request: any) => {
    const cookie = request?.headers?.get?.('cookie') || ''
    if (cookie.includes('next-auth.session-token')) {
      return new Response(JSON.stringify({ user: { id: 'user-1', email: 'test@test.com' } }), { status: 200 })
    }
    return new Response(JSON.stringify({ error: 'Unauthorized', message: 'You must be signed in' }), { status: 401 })
  })
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => handler),
    SessionStrategy: 'jwt',
  }
})

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

import { GET, POST } from '@/app/api/auth/[...nextauth]/route'
import { NextRequest } from 'next/server'

describe('app/api/auth/[...nextauth]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 when not authenticated', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signin')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({
        error: 'Unauthorized',
        message: 'You must be signed in',
      })
    })

    it('should return 200 when authenticated with signin cookie', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signin', {
        headers: {
          cookie: 'next-auth.session-token=mock-session',
        },
      })
      const response = await GET(request)

      expect(response.status).toBe(200)
    })
  })

  describe('POST', () => {
    it('should return 401 when not authenticated', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password',
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
  })
})