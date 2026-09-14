import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  message?: string
}

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 1000,
  message: 'Too many requests. Please try again later.',
}

export const AUTH_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60 * 1000,
  message: 'Too many authentication attempts. Please try again later.',
}

export const EXPORT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 60 * 1000,
  message: 'Too many export requests. Please try again later.',
}

export function rateLimit(config: RateLimitConfig = DEFAULT_RATE_LIMIT) {
  return function (request: NextRequest, response: NextResponse) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const key = `${ip}:${request.nextUrl.pathname}`
    const now = Date.now()

    const entry = rateLimitStore.get(key)

    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs })
      return
    }

    if (entry.count >= config.maxRequests) {
      return NextResponse.json(
        { error: config.message || 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    entry.count++
  }
}

export function getRateLimitHeaders(config: RateLimitConfig) {
  const ip = 'unknown'
  const key = `${ip}:`
  const entry = rateLimitStore.get(key)
  const remaining = entry ? config.maxRequests - entry.count : config.maxRequests

  return {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': Math.max(0, remaining).toString(),
    'X-RateLimit-Reset': entry ? Math.ceil(entry.resetAt / 1000).toString() : Math.ceil((Date.now() + config.windowMs) / 1000).toString(),
  }
}

export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function validatePassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return { valid: errors.length === 0, errors }
}

export function validateTaskData(data: any): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!data.title || typeof data.title !== 'string') {
    errors.push('Title is required')
  } else if (data.title.length > 200) {
    errors.push('Title must be less than 200 characters')
  }

  if (data.description && data.description.length > 2000) {
    errors.push('Description must be less than 2000 characters')
  }

  return { valid: errors.length === 0, errors }
}

export function getSecurityHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none';",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-XSS-Protection': '1; mode=block',
  }
}

export function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = getSecurityHeaders()
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }
  return response
}

export function checkCSRF(request: NextRequest): boolean {
  const method = request.method
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true

  const csrfToken = request.headers.get('x-csrf-token')
  const cookieToken = request.cookies.get('csrf-token')?.value

  if (!csrfToken || !cookieToken) return false
  return csrfToken === cookieToken
}

export function generateCSRFToken(): string {
  return crypto.randomUUID()
}