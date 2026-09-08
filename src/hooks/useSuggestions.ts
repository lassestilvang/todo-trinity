"use client"

import { useState, useCallback } from 'react'
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

  const nlpParser = new EnhancedNLPParser()

  const parseNaturalLanguage = useCallback(
    async (text: string): Promise<SuggestionResult> => {
      setIsParsing(true)
      setError(null)

      try {
        // Use the enhanced NLP parser
        const result = await nlpParser.parseNaturalLanguage(text)

        // Convert to the expected format
        return {
          task: {
            title: result.task.title,
            description: result.task.description,
            priority: result.task.priority as any,
            status: result.task.status as any,
            dueDate: result.task.dueDate,
            listId: result.task.listId,
            labelIds: result.task.labelIds
          },
          confidence: result.confidence,
          suggestions: result.suggestions
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