import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// POST /api/backup - Trigger backup
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to create backup' },
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

    const { type } = body

    const backup = await prisma.backup.create({
      data: {
        userId,
        fileName: `todo-trinity-backup-${new Date().toISOString().split('T')[0]}`,
        fileSize: 0, // Will be calculated when complete
        status: 'PROCESSING',
        type: type || 'full',
      }
    })

    // TODO: Trigger background backup process
    // This would typically involve:
    // 1. Exporting all user data
    // 2. Compressing to file
    // 3. Uploading to storage (S3, etc.)
    // 4. Updating backup record with file size and status

    return NextResponse.json({
      message: 'Backup process started',
      backup
    })
  } catch (error) {
    console.error('Error creating backup:', error)
    return NextResponse.json(
      { error: 'Failed to create backup', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET /api/backup - Get backup history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to view backups' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const backups = await prisma.backup.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20 // Limit to recent 20 backups
    })

    return NextResponse.json({ backups })
  } catch (error) {
    console.error('Error fetching backups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch backups', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}