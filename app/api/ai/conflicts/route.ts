import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { conflictDetector } from '@/lib/ai/conflict-detection'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to access AI features' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const analysis = await conflictDetector.detectConflicts(userId)

    return NextResponse.json({
      success: true,
      conflicts: analysis.conflicts,
      summary: analysis.summary,
      generatedAt: analysis.generatedAt,
      timeBlocks: analysis.timeBlocks
    })
  } catch (error) {
    console.error('Error detecting conflicts:', error)
    return NextResponse.json(
      { error: 'Failed to detect conflicts', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}