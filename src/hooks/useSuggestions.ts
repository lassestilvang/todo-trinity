"use client"

import { useState, useCallback, useMemo } from 'react'
import { EnhancedNLPParser } from '@/lib/suggestions'
import { useMutation } from '@tanstack/react-query'

interface SuggestionResult {
  task: {
    title: string
    description: string
    priority: 'low' | 'normal' | 'high' | 'urgent'
    status: 'todo' | 'in_progress' | 'completed'
    dueDate: string | null
    listId: string | null
    labelIds: string[]
  }
  confidence: number
  suggestions: string[]
}

interface UseSuggestionsResult {
  parseNaturalLanguage: (text: string) => Promise<SuggestionResult>
  isParsing: boolean
  error: string | null
}

export function useSuggestions(): UseSuggestionsResult {
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Memoize the parser instance so it doesn't change on every render
  const nlpParser = useMemo(() => new EnhancedNLPParser(), [])

  const parseNaturalLanguage = useCallback(
    async (text: string): Promise<SuggestionResult> => {
      setIsParsing(true)
      setError(null)

      try {
        // Use the enhanced NLP parser
        const result = nlpParser.parseNaturalLanguage(text)

        if (!result) {
          throw new Error('Failed to parse natural language text')
        }

        // Convert to the expected format
        return {
          task: {
            title: result.title,
            description: result.description || '',
            priority: (result.priority || 'NORMAL') as any,
            status: (result.status || 'todo') as any,
            dueDate: result.dueDate ? result.dueDate.toISOString() : null,
            listId: result.listId || null,
            labelIds: result.labelIds || []
          },
          confidence: result.confidence || 0,
          suggestions: result.suggestions || []
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse natural language')
        throw err
      } finally {
        setIsParsing(false)
      }
    },
    [nlpParser]
  )

  return { parseNaturalLanguage, isParsing, error }
}