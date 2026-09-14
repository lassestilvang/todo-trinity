import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get security settings
    const securitySettings = await prisma.adminSetting.findMany({
      where: { category: 'security' },
    })

    const settings = Object.fromEntries(
      securitySettings.map((s) => [s.key, s.value])
    )

    return NextResponse.json({
      ...settings,
      twoFactorEnabled: settings.twoFactorEnabled === 'true',
      passwordPolicyEnabled: settings.passwordPolicyEnabled === 'true',
      sessionTimeout: parseInt(settings.sessionTimeout || '3600'),
      maxLoginAttempts: parseInt(settings.maxLoginAttempts || '5'),
      lockoutDuration: parseInt(settings.lockoutDuration || '900'),
    })
  } catch (error) {
    console.error('Error fetching security settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch security settings' },
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      twoFactorEnabled,
      passwordPolicyEnabled,
      sessionTimeout,
      maxLoginAttempts,
      lockoutDuration,
    } = body

    const settingsToUpdate = [
      { key: 'twoFactorEnabled', value: String(twoFactorEnabled) },
      { key: 'passwordPolicyEnabled', value: String(passwordPolicyEnabled) },
      { key: 'sessionTimeout', value: String(sessionTimeout) },
      { key: 'maxLoginAttempts', value: String(maxLoginAttempts) },
      { key: 'lockoutDuration', value: String(lockoutDuration) },
    ]

    // Update or create each setting
    const updatePromises = settingsToUpdate.map(({ key, value }) =>
      prisma.adminSetting.upsert({
        where: { category_key: { category: 'security', key } },
        update: { value },
        create: { category: 'security', key, value },
      })
    )

    await Promise.all(updatePromises)

    return NextResponse.json({ message: 'Security settings updated successfully' })
  } catch (error) {
    console.error('Error updating security settings:', error)
    return NextResponse.json(
      { error: 'Failed to update security settings' },
      { status: 500 }
    )
  }
}