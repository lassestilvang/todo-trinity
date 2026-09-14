import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recordSocialActivity, recordUserShare, getUserSocialActivities, getUserShares, getTrendingActivities, getLeaderboardParticipants } from '@/lib/gamification/social'

// GET /api/gamification/social - Get social activities for user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    let activities
    if (type) {
      activities = await getUserSocialActivities(userId)
      // Filter by type if specified
      if (type) {
        activities = activities.filter(a => a.type === type)
      }
      activities = activities.slice(0, limit)
    } else {
      activities = await getUserSocialActivities(userId, limit)
    }

    const shares = await getUserShares(userId, limit)

    return NextResponse.json({ activities, shares })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch social data' },
      { status: 500 }
    )
  }
}

// POST /api/gamification/social/activity - Record a social activity
export async function POST_ACTIVITY(request: Request) {
  try {
    const { userId, type, title, description, metadata } = await request.json()

    if (!userId || !type || !title) {
      return NextResponse.json(
        { error: 'User ID, type, and title are required' },
        { status: 400 }
      )
    }

    await recordSocialActivity(userId, type, title, description, metadata)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to record social activity' },
      { status: 500 }
    )
  }
}

// POST /api/gamification/social/share - Record a user share
export async function POST_SHARE(request: Request) {
  try {
    const { userId, type, message, platform } = await request.json()

    if (!userId || !type || !message) {
      return NextResponse.json(
        { error: 'User ID, type, and message are required' },
        { status: 400 }
      )
    }

    await recordUserShare(userId, type, message, platform)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to record user share' },
      { status: 500 }
    )
  }
}

// GET /api/gamification/social/trending - Get trending activities
export async function GET_TRENDING(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'task_completed'
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const activities = await getTrendingActivities(type as any, limit)
    return NextResponse.json({ activities })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch trending activities' },
      { status: 500 }
    )
  }
}

// GET /api/gamification/social/leaderboard - Get leaderboard participants
export async function GET_LEADERBOARD(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all_time'
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const participants = await getLeaderboardParticipants(period as any, limit)
    return NextResponse.json({ participants })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leaderboard participants' },
      { status: 500 }
    )
  }
}