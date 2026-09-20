import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { CalendarIntegration } from '@/lib/integrations/calendar'

// GET /api/integrations/calendar/oauth/initiate - Initiate OAuth flow
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to connect calendar' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const provider = (searchParams.get('provider') || 'google') as 'google' | 'outlook'

    if (provider !== 'google' && provider !== 'outlook') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid provider. Use "google" or "outlook"' },
        { status: 400 }
      )
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/calendar/oauth/callback`
    const authUrl = await CalendarIntegration.getAuthUrl(provider, redirectUri)

    return NextResponse.json({
      success: true,
      authUrl,
      provider
    })
  } catch (error) {
    console.error('OAuth initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}