import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getTaskSuggestions, parseNaturalLanguage } from '@/lib/suggestions'

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
    const suggestions = await getTaskSuggestions(userId)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error fetching suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suggestions', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Text is required' },
        { status: 400 }
      )
    }

    const parsed = parseNaturalLanguage(text, userId)

    if (!parsed) {
      return NextResponse.json(
        { error: 'Could not parse', message: 'Unable to extract task details from text' },
        { status: 400 }
      )
    }

    return NextResponse.json({ parsed })
  } catch (error) {
    console.error('Error parsing natural language:', error)
    return NextResponse.json(
      { error: 'Failed to parse', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}