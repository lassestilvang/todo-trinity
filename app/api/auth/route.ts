import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword } from '@/lib/password'
import { signUpSchema, signInSchema } from '@/lib/validations/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }

    // Handle sign-up
    if (body.action === 'signup') {
      const validated = signUpSchema.parse(body)

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: validated.email },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already exists', message: 'A user with this email already exists' },
          { status: 409 }
        )
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validated.password, 10)

      // Create user
      const user = await prisma.user.create({
        data: {
          name: validated.name,
          email: validated.email,
          password: hashedPassword,
        },
      })

      // Remove password from response
      const { password, ...userWithoutPassword } = user

      return NextResponse.json(
        {
          message: 'User created successfully',
          user: userWithoutPassword,
        },
        { status: 201 }
      )
    }

    // Handle sign-in
    if (body.action === 'signin') {
      const validated = signInSchema.parse(body)

      const user = await prisma.user.findUnique({
        where: { email: validated.email },
      })

      if (!user || !user.password) {
        return NextResponse.json(
          { error: 'Invalid credentials', message: 'Invalid email or password' },
          { status: 401 }
        )
      }

      const isValid = await bcrypt.compare(validated.password, user.password)

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid credentials', message: 'Invalid email or password' },
          { status: 401 }
        )
      }

      const { password, ...userWithoutPassword } = user

      return NextResponse.json({
        message: 'Sign in successful',
        user: userWithoutPassword,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action', message: 'Action must be "signup" or "signin"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}