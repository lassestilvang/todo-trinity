import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CalendarIntegration } from '@/lib/integrations/calendar'

// GET /api/integrations/calendar/oauth/callback - Handle OAuth callback
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.redirect(
        new URL('/auth/signin?error=unauthorized', request.url)
      )
    }

    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // 'google' or 'outlook'
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?calendar_error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings?calendar_error=missing_parameters', request.url)
      )
    }

    const provider = state as 'google' | 'outlook'
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/calendar/oauth/callback`

    try {
      // Exchange code for tokens
      const tokens = await CalendarIntegration.exchangeCodeForTokens(provider, code, redirectUri)

      // Store tokens in UserSetting
      const calendarConfig = {
        provider,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
        connectedAt: new Date().toISOString()
      }

      await prisma.userSetting.upsert({
        where: { userId },
        update: {
          integrations: {
            calendar: calendarConfig
          } as any
        },
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
          calendarSync: {} as any,
          integrations: {
            calendar: calendarConfig
          } as any
        }
      })

      return NextResponse.redirect(
        new URL('/settings?calendar_connected=' + provider, request.url)
      )
    } catch (tokenError) {
      console.error('Token exchange failed:', tokenError)
      return NextResponse.redirect(
        new URL(`/settings?calendar_error=${encodeURIComponent('Failed to connect calendar')}`, request.url)
      )
    }
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/settings?calendar_error=server_error', request.url)
    )
  }
}