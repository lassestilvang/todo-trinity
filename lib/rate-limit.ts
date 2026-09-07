import { NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export interface RateLimitOptions {
  maxRequests?: number
  windowMs?: number
}

export function rateLimit(options: RateLimitOptions = {}) {
  const maxRequests = options.maxRequests || 100
  const windowMs = options.windowMs || 60000

  function checkRateLimit(url: string, headers: Headers): NextResponse | null {
    const ip = headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown'
    const key = `${ip}:${url}`

    const now = Date.now()
    const entry = rateLimitStore.get(key)

    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs,
      })
      return null
    }

    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(entry.resetAt),
          },
        }
      )
    }

    entry.count++
    return null
  }

  return checkRateLimit
}