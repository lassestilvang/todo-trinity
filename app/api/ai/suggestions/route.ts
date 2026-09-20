import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getTaskSuggestions } from '@/lib/suggestions'

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

    // Get suggestions from the enhanced NLP-based suggestion system
    const suggestions = await getTaskSuggestions(userId)

    // Transform suggestions to match expected format
    const transformedSuggestions = suggestions.map((suggestion: any) => {
      const suggestionData = {
        title: suggestion.title || suggestion.suggestedPriority || 'Suggestion',
        reason: suggestion.reason || 'AI-powered suggestion',
        suggestedPriority: suggestion.suggestedPriority,
        confidence: suggestion.confidence || 0,
        suggestions: suggestion.suggestions || []
      }
      return suggestionData
    })

    return NextResponse.json({
      success: true,
      suggestions: transformedSuggestions,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching AI suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suggestions', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}