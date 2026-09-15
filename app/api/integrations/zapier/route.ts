import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
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
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      )
    }

    // Update user setting field directly
    const userSetting = await prisma.userSetting.upsert({
      where: { userId },
      update: {
        [key]: value,
      },
      create: {
        userId,
        [key]: value,
        // Set defaults for other fields
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        notifications: true,
        emailNotifications: true,
        desktopNotifications: true,
        soundNotifications: false,
        integrations: {},
        calendarSync: null,
      },
    })

    return NextResponse.json({ success: true, userSetting })
  } catch (error) {
    console.error('Error updating user setting:', error)
    return NextResponse.json(
      { error: 'Failed to update user setting' },
      { status: 500 }
    )
  }
}