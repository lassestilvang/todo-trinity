import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/integrations - Get user's connected integrations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to view integrations' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const integrations = await prisma.connectedAccount.findMany({
      where: { userId }
    })

    return NextResponse.json({ integrations })
  } catch (error) {
    console.error('Error fetching integrations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integrations', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/integrations/connect - Connect a new integration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to connect integrations' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    let body: any

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }

    const { provider, providerId, accessToken, refreshToken, expiresAt, scope } = body

    if (!provider) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'provider is required' },
        { status: 400 }
      )
    }

    // Check if integration already exists
    const existing = await prisma.connectedAccount.findFirst({
      where: { userId, provider }
    })

    if (existing) {
      // Update existing integration
      await prisma.connectedAccount.update({
        where: { id: existing.id },
        data: {
          providerId,
          accessToken,
          refreshToken,
          expiresAt,
          scope,
          updatedAt: new Date(),
        }
      })
      return NextResponse.json({
        message: 'Integration updated successfully',
        integration: { ...existing, ...{ providerId, accessToken, refreshToken, expiresAt, scope } }
      })
    }

    // Create new integration
    const integration = await prisma.connectedAccount.create({
      data: {
        userId,
        provider,
        providerId,
        accessToken,
        refreshToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        scope,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })

    return NextResponse.json({
      message: 'Integration connected successfully',
      integration
    })
  } catch (error) {
    console.error('Error connecting integration:', error)
    return NextResponse.json(
      { error: 'Failed to connect integration', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/integrations/disconnect - Disconnect an integration
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to disconnect integrations' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    let body: any

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }

    const { provider } = body

    if (!provider) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'provider is required' },
        { status: 400 }
      )
    }

    await prisma.connectedAccount.delete({
      where: { userId, provider }
    })

    return NextResponse.json({ message: 'Integration disconnected successfully' })
  } catch (error) {
    console.error('Error disconnecting integration:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect integration', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}