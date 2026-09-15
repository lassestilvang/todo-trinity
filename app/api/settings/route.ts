import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const userSetting = await prisma.userSetting.findUnique({
      where: { userId },
    })

    if (!userSetting) {
      // Return default settings
      return NextResponse.json({
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        notifications: true,
        emailNotifications: true,
        desktopNotifications: true,
        soundNotifications: false,
        calendarSync: null,
        integrations: {},
      })
    }

    return NextResponse.json(userSetting)
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const body = await request.json()

    // Only allow specific fields to be updated
    const allowedUpdates: Record<keyof typeof body, string> = {
      theme: 'theme',
      language: 'language',
      timezone: 'timezone',
      dateFormat: 'dateFormat',
      timeFormat: 'timeFormat',
      notifications: 'notifications',
      emailNotifications: 'emailNotifications',
      desktopNotifications: 'desktopNotifications',
      soundNotifications: 'soundNotifications',
      calendarSync: 'calendarSync',
      integrations: 'integrations',
    }

    const updates: Partial<import('@/lib/prisma').UserSetting> = {}
    for (const [key, value] of Object.entries(body)) {
      if (key in allowedUpdates) {
        ;(updates as any)[allowedUpdates[key]] = value
      }
    }

    const userSetting = await prisma.userSetting.upsert({
      where: { userId },
      update: updates as any,
      create: {
        userId,
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        notifications: true,
        emailNotifications: true,
        desktopNotifications: true,
        soundNotifications: false,
        calendarSync: Prisma.JsonNull,
        integrations: {},
      },
    })

    return NextResponse.json(userSetting)
  } catch (error) {
    console.error('Error updating user settings:', error)
    return NextResponse.json(
      { error: 'Failed to update user settings' },
      { status: 500 }
    )
  }
}