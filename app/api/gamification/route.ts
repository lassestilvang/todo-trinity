import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getUserGamification, checkAndAwardBadges } from '@/lib/gamification'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const gamification = await getUserGamification(userId)
    const newBadges = await checkAndAwardBadges(userId)

    return NextResponse.json({
      ...gamification,
      newBadges,
    })
  } catch (error) {
    console.error('Error fetching gamification data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gamification data', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}