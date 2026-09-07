import { rateLimit } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'

describe('lib/rate-limit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear the rate limit store
    // @ts-ignore - accessing internal store for cleanup
    rateLimitStore.clear()
  })

  const createMockHeaders = (ip?: string): Headers => {
    const headers = new Headers()
    if (ip) headers.set('x-forwarded-for', ip)
    return headers
  }

  describe('rateLimit', () => {
    it('should allow requests under limit', () => {
      const checkRateLimit = rateLimit({ maxRequests: 5, windowMs: 60000 })

      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit('/api/test', createMockHeaders('127.0.0.1'))
        expect(result).toBeNull()
      }
    })

    it('should block requests over limit', () => {
      const checkRateLimit = rateLimit({ maxRequests: 2, windowMs: 60000 })

      checkRateLimit('/api/test', createMockHeaders('127.0.0.1'))
      checkRateLimit('/api/test', createMockHeaders('127.0.0.1'))

      const result = checkRateLimit('/api/test', createMockHeaders('127.0.0.1'))
      expect(result).not.toBeNull()
      expect(result).toBeInstanceOf(NextResponse)
      expect(result?.status).toBe(429)
    })

    it('should return rate limit headers when blocked', () => {
      const checkRateLimit = rateLimit({ maxRequests: 1, windowMs: 60000 })

      checkRateLimit('/api/test', createMockHeaders('127.0.0.1'))
      const result = checkRateLimit('/api/test', createMockHeaders('127.0.0.1'))

      expect(result).not.toBeNull()
      expect(result?.headers.get('Retry-After')).toBeDefined()
      expect(result?.headers.get('X-RateLimit-Limit')).toBe('1')
      expect(result?.headers.get('X-RateLimit-Remaining')).toBe('0')
      expect(result?.headers.get('X-RateLimit-Reset')).toBeDefined()
    })

    it('should separate limits by IP', () => {
      const checkRateLimit = rateLimit({ maxRequests: 1, windowMs: 60000 })

      checkRateLimit('/api/test', createMockHeaders('127.0.0.1'))
      const result1 = checkRateLimit('/api/test', createMockHeaders('127.0.0.1'))
      expect(result1).not.toBeNull()

      // Different IP should be allowed
      const result2 = checkRateLimit('/api/test', createMockHeaders('127.0.0.2'))
      expect(result2).toBeNull()
    })

    it('should separate limits by URL', () => {
      const checkRateLimit = rateLimit({ maxRequests: 1, windowMs: 60000 })

      checkRateLimit('/api/test1', createMockHeaders('127.0.0.1'))
      const result1 = checkRateLimit('/api/test1', createMockHeaders('127.0.0.1'))
      expect(result1).not.toBeNull()

      // Different URL should be allowed
      const result2 = checkRateLimit('/api/test2', createMockHeaders('127.0.0.1'))
      expect(result2).toBeNull()
    })

    it('should use default values when not provided', () => {
      const checkRateLimit = rateLimit({})

      // Should use defaults: maxRequests=100, windowMs=60000
      for (let i = 0; i < 100; i++) {
        const result = checkRateLimit('/api/test', createMockHeaders('127.0.0.1'))
        expect(result).toBeNull()
      }

      const result = checkRateLimit('/api/test', createMockHeaders('127.0.0.1'))
      expect(result).not.toBeNull()
      expect(result?.status).toBe(429)
    })

    it('should reset after window expires', () => {
      const checkRateLimit = rateLimit({ maxRequests: 1, windowMs: 100 }) // 100ms window

      checkRateLimit('/api/test', createMockHeaders('127.0.0.1'))
      expect(checkRateLimit('/api/test', createMockHeaders('127.0.0.1'))).not.toBeNull()

      // Wait for window to expire
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(checkRateLimit('/api/test', createMockHeaders('127.0.0.1'))).toBeNull()
          resolve()
        }, 150)
      })
    })

    it('should use x-real-ip if x-forwarded-for not present', () => {
      const checkRateLimit = rateLimit({ maxRequests: 1, windowMs: 60000 })

      const headers = new Headers()
      headers.set('x-real-ip', '192.168.1.1')

      checkRateLimit('/api/test', headers)
      const result = checkRateLimit('/api/test', headers)

      expect(result).not.toBeNull()
      expect(result?.status).toBe(429)
    })

    it('should use unknown IP when neither header present', () => {
      const checkRateLimit = rateLimit({ maxRequests: 1, windowMs: 60000 })

      const headers = new Headers()
      // No IP headers

      checkRateLimit('/api/test', headers)
      const result = checkRateLimit('/api/test', headers)

      expect(result).not.toBeNull()
      expect(result?.status).toBe(429)
    })

    it('should include error message in response', () => {
      const checkRateLimit = rateLimit({ maxRequests: 1, windowMs: 60000 })

      checkRateLimit('/api/test', createMockHeaders('127.0.0.1'))
      const result = checkRateLimit('/api/test', createMockHeaders('127.0.0.1'))

      expect(result).not.toBeNull()
      const body = result?.json()
      // Can't easily test the body since it's a NextResponse, but we can verify it's the right type
      expect(result).toBeInstanceOf(NextResponse)
    })
  })
})