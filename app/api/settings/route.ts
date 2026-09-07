import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/settings - Get user settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to view settings' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const settings = await prisma.userSetting.findMany({
      where: { userId }
    })

    // Convert to key-value object
    const settingsObj: Record<string, string> = {}
    settings.forEach(s => {
      settingsObj[s.key] = s.value
    })

    // Default settings
    const defaults = {
      theme: 'system',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      notifications: 'true',
      emailNotifications: 'true',
      desktopNotifications: 'true',
      soundNotifications: 'false',
      autoSave: 'true',
      showCompleted: 'true',
      compactMode: 'false',
      weekStartsOn: '0', // 0 = Sunday, 1 = Monday
      defaultTaskView: 'list',
      defaultSortBy: 'createdAt',
      defaultSortOrder: 'desc',
      dailyGoal: '5',
      reminderTime: '09:00',
      reminderEnabled: 'true',
      keyboardShortcuts: 'true',
      animationsEnabled: 'true',
    }

    // Merge defaults with user settings
    const mergedSettings = { ...defaults, ...settingsObj }

    return NextResponse.json({ settings: mergedSettings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT /api/settings - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to update settings' },
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

    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'settings object is required' },
        { status: 400 }
      )
    }

    // Upsert each setting
    const updates = Object.entries(settings).map(async ([key, value]) => {
      return prisma.userSetting.upsert({
        where: {
          userId_key: { userId, key }
        },
        update: { value: String(value) },
        create: { userId, key, value: String(value) }
      })
    })

    await Promise.all(updates)

    return NextResponse.json({ message: 'Settings updated successfully' })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}