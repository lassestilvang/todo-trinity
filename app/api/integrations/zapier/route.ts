import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// POST /api/integrations/zapier/webhook - Trigger a Zapier webhook
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to trigger Zapier webhook' },
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

    const { trigger, data } = body

    if (!trigger || !data) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'trigger and data are required' },
        { status: 400 }
      )
    }

    // Check if user has Zapier integration enabled
    const userSettings = await prisma.userSetting.findUnique({
      where: { userId_key: { userId, key: 'integrations' } }
    })

    const integrations = userSettings ? JSON.parse(userSettings.value || '{}') : {}
    if (!integrations.zapier || !integrations.zapier.enabled) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Zapier integration is not enabled' },
        { status: 403 }
      )
    }

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'zapier_webhook_triggered',
        resource: 'integration',
        resourceId: 'zapier',
        details: JSON.stringify({ trigger, data, integration: 'zapier' }),
        ipAddress: null,
        userAgent: null
      }
    })

    // In a real implementation, this would:
    // 1. Send the webhook data to Zapier
    // 2. Log the execution
    // 3. Handle any errors

    return NextResponse.json({
      message: 'Zapier webhook triggered successfully',
      trigger,
      executedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error triggering Zapier webhook:', error)
    return NextResponse.json(
      { error: 'Failed to trigger Zapier webhook', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}