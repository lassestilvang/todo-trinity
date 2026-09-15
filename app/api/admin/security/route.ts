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
      select: { roles: { select: { role: true } } },
    })

    const userRoles = user?.roles?.map(r => r.role?.name) || []
    const isAdmin = userRoles.includes('admin')

    if (!isAdmin) {
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
      select: { roles: { select: { role: true } } },
    })

    const userRoles = user?.roles?.map(r => r.role?.name) || []
    const isAdmin = userRoles.includes('admin')

    if (!isAdmin) {
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
      { category: 'security', key: 'twoFactorEnabled', value: String(twoFactorEnabled) },
      { category: 'security', key: 'passwordPolicyEnabled', value: String(passwordPolicyEnabled) },
      { category: 'security', key: 'sessionTimeout', value: String(sessionTimeout) },
      { category: 'security', key: 'maxLoginAttempts', value: String(maxLoginAttempts) },
      { category: 'security', key: 'lockoutDuration', value: String(lockoutDuration) },
    ]

    // Update or create each setting
    const updatePromises = settingsToUpdate.map(
      ({ category, key, value }) =>
        prisma.adminSetting.upsert({
          where: { key },
          update: { value },
          create: { category, key, value: value as any },
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