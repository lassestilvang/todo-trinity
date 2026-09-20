import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DailyPlanner, UserSchedulePreferences } from '@/lib/ai/daily-planner'

// GET /api/ai/daily-plan - Generate daily plan for a specific date
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
    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get('date')

    let date = new Date()
    if (dateParam) {
      date = new Date(dateParam)
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Bad Request', message: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        )
      }
    }

    // Get user preferences
    const preferences = await DailyPlanner.getUserPreferences(userId)

    // Generate daily plan
    const planner = new DailyPlanner(userId, preferences)
    const plan = await planner.generatePlan(date)

    return NextResponse.json({
      success: true,
      plan
    })
  } catch (error) {
    console.error('Error generating daily plan:', error)
    return NextResponse.json(
      { error: 'Failed to generate daily plan', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/ai/daily-plan - Save user preferences for daily planner
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to access AI features' },
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

    const { preferences } = body

    if (!preferences) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Preferences are required' },
        { status: 400 }
      )
    }

    // Validate preferences
    const validatedPrefs: Partial<UserSchedulePreferences> = {}

    if (typeof preferences.workStartHour === 'number' && preferences.workStartHour >= 0 && preferences.workStartHour <= 23) {
      validatedPrefs.workStartHour = preferences.workStartHour
    }
    if (typeof preferences.workEndHour === 'number' && preferences.workEndHour >= 0 && preferences.workEndHour <= 23) {
      validatedPrefs.workEndHour = preferences.workEndHour
    }
    if (typeof preferences.preferredBreakDuration === 'number' && preferences.preferredBreakDuration > 0) {
      validatedPrefs.preferredBreakDuration = preferences.preferredBreakDuration
    }
    if (typeof preferences.maxFocusSession === 'number' && preferences.maxFocusSession > 0) {
      validatedPrefs.maxFocusSession = preferences.maxFocusSession
    }
    if (typeof preferences.lunchStartHour === 'number' && preferences.lunchStartHour >= 0 && preferences.lunchStartHour <= 23) {
      validatedPrefs.lunchStartHour = preferences.lunchStartHour
    }
    if (typeof preferences.lunchDuration === 'number' && preferences.lunchDuration > 0) {
      validatedPrefs.lunchDuration = preferences.lunchDuration
    }
    if (typeof preferences.bufferBetweenTasks === 'number' && preferences.bufferBetweenTasks >= 0) {
      validatedPrefs.bufferBetweenTasks = preferences.bufferBetweenTasks
    }

    await DailyPlanner.saveUserPreferences(userId, validatedPrefs)

    return NextResponse.json({
      success: true,
      message: 'Preferences saved successfully',
      preferences: validatedPrefs
    })
  } catch (error) {
    console.error('Error saving daily planner preferences:', error)
    return NextResponse.json(
      { error: 'Failed to save preferences', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}