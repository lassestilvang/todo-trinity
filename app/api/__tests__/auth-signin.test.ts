// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

import { getServerSession } from 'next-auth/next'
import { POST } from '@/app/api/auth/route'
import { NextRequest } from 'next/server'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('app/api/auth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST (signup)', () => {
    it('should create a new user', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
      })

      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup',
          email: 'test@example.com',
          password: 'Password123',
          name: 'Test User',
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.message).toBe('User created successfully')
      expect(body.user.email).toBe('test@example.com')
      expect(body.user.name).toBe('Test User')
      expect(body.user.password).toBeUndefined()
    })

    it('should return 409 when email already exists', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Existing User',
        password: 'hashed-password',
      })

      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup',
          email: 'test@example.com',
          password: 'Password123',
          name: 'New User',
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(409)
      const body = await response.json()
      expect(body.error).toBe('Email already exists')
    })

    it('should return 400 for invalid action', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invalid' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('Invalid action')
    })

    it('should return 400 for invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: 'invalid json',
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('Invalid JSON')
    })
  })

  describe('POST (signin)', () => {
    it('should return 400 when user not found', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signin',
          email: 'nonexistent@example.com',
          password: 'Password123',
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error).toBe('Invalid credentials')
    })

    it('should return 401 for wrong password', async () => {
      const bcrypt = require('bcryptjs')
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false)

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
      })

      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signin',
          email: 'test@example.com',
          password: 'WrongPassword',
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error).toBe('Invalid credentials')
    })

    it('should return user on successful signin', async () => {
      const bcrypt = require('bcryptjs')
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true)

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
      })

      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signin',
          email: 'test@example.com',
          password: 'Password123',
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.message).toBe('Sign in successful')
      expect(body.user.email).toBe('test@example.com')
      expect(body.user.password).toBeUndefined()
    })

    it('should return 500 on server error', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signin',
          email: 'test@example.com',
          password: 'Password123',
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.error).toBe('Authentication failed')
    })
  })
})