"use client"

import { Task, Priority, TaskStatus } from '@/src/types/index'

interface ParsedResult {
  title: string
  description?: string
  priority: string
  status?: string
  dueDate?: Date | null
  listId?: string | null
  labelIds?: string[]
  confidence?: number
  suggestions?: string[]
}

interface EnhancedNLPOptions {
  extractRecurring?: boolean
  extractDependencies?: boolean
  extractContext?: boolean
  extractPriority?: boolean
  extractDeadline?: boolean
  parseTime?: boolean
}

export class EnhancedNLPParser {
  private recurringPatterns = [
    /every (monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?: (at|by) \d{1,2}(?::\d{2})?)?/i,
    /every (mon|tue|wed|thu|fri|sat|sun) \d{1,2}(?::\d{2})?/i,
    /every (week|month|year)/i,
    /(every|each) (?:day|week|month|year)/i,
    /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?/i,
    /(january|february|march|april|may|june|july|august|september|october|november|december)/i
  ]

  private dependencyPatterns = [
    /after (?:completing|finishing|doing|creating|writing|reading)/i,
    /before (?:starting|beginning|doing|completing|finishing)/i,
    /once (?:I|you|we) (?:finish|complete|finish|do)/i,
    /(first|second|third|then|next)/i,
    /(while|during|simultaneously with)/i
  ]

  private contextPatterns = [
    /#work|#personal|#urgent|#home|#family/i,
    /@(?:\w+\.\w+@[\w.]+|project|team|admin)/i,
    /from (?:email|mail|message)/i,
    /calendar|meeting|event|agenda/i,
    /call|email|message|chat|slack|teams|discord/i
  ]

  private timePatterns = [
    /(?:in|by|before|at) (\d{1,2})(?::\d{2})? (?:pm|am|minutes?|hours)/i,
    /(today|tomorrow|yesterday)/i,
    /(next|following) (?:week|month|year)/i,
    /(this) (?:week|month|year)/i,
    /(in|within) (\d+) (?:days?|weeks?|months?|years?)/i
  ]

  parseNaturalLanguage(text: string, options?: EnhancedNLPOptions): ParsedResult | null {
    const trimmed = text.trim()
    if (!trimmed) return null

    const result: ParsedResult = {
      title: trimmed,
      priority: 'NORMAL',
    }

    const lowerText = trimmed.toLowerCase()

    // Extract priority
    if (lowerText.includes('urgent') || lowerText.includes('critical') || lowerText.includes('asap')) {
      result.priority = 'URGENT'
    } else if (lowerText.includes('high') || lowerText.includes('important')) {
      result.priority = 'HIGH'
    } else if (lowerText.includes('low') || lowerText.includes('later')) {
      result.priority = 'LOW'
    }

    // Extract deadline
    const dueDate = this.extractDeadline(trimmed)
    if (dueDate) {
      result.dueDate = dueDate
    }

    return result
  }

  private extractDeadline(text: string): Date | null {
    const lowerText = text.toLowerCase()

    if (lowerText.includes('today')) {
      return new Date()
    }
    if (lowerText.includes('tomorrow')) {
      const date = new Date()
      date.setDate(date.getDate() + 1)
      return date
    }
    if (lowerText.includes('yesterday')) {
      const date = new Date()
      date.setDate(date.getDate() - 1)
      return date
    }

    // Handle MM/DD date format
    const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})/)
    if (dateMatch) {
      const month = parseInt(dateMatch[1]) - 1
      const day = parseInt(dateMatch[2])
      const date = new Date()
      date.setMonth(month)
      date.setDate(day)
      return date
    }

    return null
  }
}

export async function getTaskSuggestions(userId: string): Promise<any[]> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { prisma } = require('@/lib/prisma')

  const tasks = await prisma.task.findMany({
    where: { userId, status: 'pending' },
    include: { list: true, labels: true },
    orderBy: { createdAt: 'desc' },
  })

  const suggestions: any[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const task of tasks) {
    const taskSuggestions = generateTaskSuggestions(task, today)
    suggestions.push(...taskSuggestions)
  }

  // Sort by confidence descending
  suggestions.sort((a, b) => b.confidence - a.confidence)

  return suggestions.slice(0, 5)
}

function generateTaskSuggestions(task: any, today: Date): any[] {
  const suggestions: any[] = []

  if (task.dueDate && new Date(task.dueDate) < today) {
    suggestions.push({
      title: 'Review 1 overdue task',
      suggestedPriority: 'HIGH',
      confidence: 0.9,
      reason: 'Overdue tasks detected',
    })
    return suggestions
  }

  if (task.priority === 'URGENT' || task.priority === 'HIGH') {
    suggestions.push({
      title: 'Focus on 1 high priority task',
      suggestedPriority: 'HIGH',
      confidence: 0.85,
      reason: 'High priority tasks pending',
    })
  } else if (task.priority === 'LOW') {
    suggestions.push({
      title: 'Consider low priority task',
      suggestedPriority: 'LOW',
      confidence: 0.5,
      reason: 'Low priority tasks pending',
    })
  }

  return suggestions
}

export function parseNaturalLanguage(text: string, userId: string): ParsedResult | null {
  const parser = new EnhancedNLPParser()
  return parser.parseNaturalLanguage(text)
}