import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ChallengeEngine } from '@/lib/gamification/challenges'

// GET /api/gamification/challenges - Get active challenges for user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    let challenges
    if (type === 'leaderboard') {
      const challengeId = searchParams.get('challengeId')
      if (!challengeId) {
        return NextResponse.json(
          { error: 'Challenge ID is required for leaderboard' },
          { status: 400 }
        )
      }
      const leaderboard = await ChallengeEngine.getChallengeLeaderboard(challengeId)
      return NextResponse.json({ leaderboard })
    } else if (type === 'progress') {
      challenges = await ChallengeEngine.getUserChallengeProgress(userId)
    } else {
      challenges = await ChallengeEngine.getActiveChallenges(userId)
    }

    return NextResponse.json({ challenges })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch challenges' },
      { status: 500 }
    )
  }
}

// POST /api/gamification/challenges/join - Join a challenge
export async function POST(request: Request) {
  try {
    const { userId, challengeId } = await request.json()

    if (!userId || !challengeId) {
      return NextResponse.json(
        { error: 'User ID and Challenge ID are required' },
        { status: 400 }
      )
    }

    const result = await ChallengeEngine.joinChallenge(userId, challengeId)
    return NextResponse.json(result, { status: result.success ? 201 : 400 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to join challenge' },
      { status: 500 }
    )
  }
}

// PUT /api/gamification/challenges/update-progress - Update challenge progress
export async function PUT(request: Request) {
  try {
    const { userId, challengeId, taskCompleted } = await request.json()

    if (!userId || !challengeId) {
      return NextResponse.json(
        { error: 'User ID and Challenge ID are required' },
        { status: 400 }
      )
    }

    await ChallengeEngine.updateProgress(userId, challengeId, taskCompleted ?? true)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update challenge progress' },
      { status: 500 }
    )
  }
}

// DELETE /api/gamification/challenges/leave - Leave a challenge
export async function DELETE(request: Request) {
  try {
    const { userId, challengeId } = await request.json()

    if (!userId || !challengeId) {
      return NextResponse.json(
        { error: 'User ID and Challenge ID are required' },
        { status: 400 }
      )
    }

    await prisma.challengeParticipant.deleteMany({
      where: {
        challengeId,
        userId,
      },
    })

    return NextResponse.json({ success: true, message: 'Left challenge' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to leave challenge' },
      { status: 500 }
    )
  }
}