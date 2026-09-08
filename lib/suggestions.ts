"use client"

import { Task, Priority, TaskStatus } from '@/src/types/index'

interface NaturalLanguageResult {
  task: {
    title: string
    description: string
    priority: Priority
    status: TaskStatus
    dueDate: string | null
    listId: string | null
    labelIds: string[]
  }
  confidence: number
  suggestions: string[]
}

interface ParsedRecurringPattern {
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly'
  daysOfWeek?: number[]
  dayOfMonth?: number
  timeOfDay?: string
  interval?: number
  endDate?: string
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

  async parseNaturalLanguage(text: string, options?: EnhancedNLPOptions): Promise<NaturalLanguageResult> {
    const opts = { extractRecurring: true, extractDependencies: true, extractContext: true, extractPriority: true, extractDeadline: true, parseTime: true, ...options }

    const result: NaturalLanguageResult = {
      task: {
        title: '',
        description: '',
        priority: Priority.NORMAL,
        status: TaskStatus.TODO,
        dueDate: null,
        listId: null,
        labelIds: []
      },
      confidence: 0,
      suggestions: []
    }

    // Extract main task title (remove time/recurring patterns)
    let processedText = text

    // Extract recurring patterns
    if (opts.extractRecurring) {
      const recurringInfo = this.extractRecurring(processedText)
      if (recurringInfo) {
        result.suggestions.push(`Recurring: ${recurringInfo.pattern}`)
      }
    }

    // Extract dependencies
    if (opts.extractDependencies) {
      const dependencies = this.extractDependencies(processedText)
      if (dependencies.length > 0) {
        result.suggestions.push(`Dependencies: ${dependencies.join(', ')}`)
      }
    }

    // Extract context
    if (opts.extractContext) {
      const context = this.extractContext(processedText)
      if (context.length > 0) {
        result.description += context.join(', ') + '\n'
      }
    }

    // Extract priority
    if (opts.extractPriority) {
      const priority = this.extractPriority(processedText)
      if (priority) {
        result.task.priority = priority
      }
    }

    // Extract deadline
    if (opts.extractDeadline) {
      const dueDate = this.extractDeadline(processedText)
      if (dueDate) {
        result.task.dueDate = dueDate
      }
    }

    // Set title (remove extracted patterns)
    result.task.title = this.cleanTaskTitle(processedText)

    // Add context to description
    if (result.description) {
      result.task.description = result.description.trim()
    }

    // Calculate confidence
    result.confidence = this.calculateConfidence(text, result)

    return result
  }

  private extractRecurring(text: string): ParsedRecurringPattern | null {
    const lowerText = text.toLowerCase()

    // Daily patterns
    if (lowerText.includes('daily') || lowerText.includes('every day')) {
      return { pattern: 'daily' }
    }

    // Weekly patterns
    if (lowerText.includes('weekly') || lowerText.includes('every week')) {
      const days = this.extractDaysOfWeek(text)
      return {
        pattern: 'weekly',
        daysOfWeek: days?.length ? days : [0, 1, 2, 3, 4] // Default to weekdays
      }
    }

    // Monthly patterns
    if (lowerText.includes('monthly') || lowerText.includes('every month')) {
      return { pattern: 'monthly' }
    }

    // Yearly patterns
    if (lowerText.includes('yearly') || lowerText.includes('every year')) {
      return { pattern: 'yearly' }
    }

    return null
  }

  private extractDependencies(text: string): string[] {
    const dependencies: string[] = []
    const lowerText = text.toLowerCase()

    // Check for common dependency patterns
    if (lowerText.includes('after ') || lowerText.includes('before ')) {
      // Extract phrases after/before keywords
      const afterMatch = text.match(/after\s+([^.,!?]+)/i)
      const beforeMatch = text.match(/before\s+([^.,!?]+)/i)

      if (afterMatch) dependencies.push(`After ${afterMatch[1]}`)
      if (beforeMatch) dependencies.push(`Before ${beforeMatch[1]}`)
    }

    return dependencies
  }

  private extractContext(text: string): string[] {
    const context: string[] = []
    const lowerText = text.toLowerCase()

    // Extract hashtags
    const hashTags = text.match(/#[a-zA-Z0-9_]+/g)
    if (hashTags) {
      context.push(...hashTags)
    }

    // Extract mentions
    const mentions = text.match(/@\w+/g)
    if (mentions) {
      context.push(...mentions)
    }

    return context
  }

  private extractPriority(text: string): Priority | null {
    const lowerText = text.toLowerCase()

    if (lowerText.includes('urgent') || lowerText.includes('critical') || lowerText.includes('asap')) {
      return Priority.URGENT
    } else if (lowerText.includes('high') || lowerText.includes('important')) {
      return Priority.HIGH
    } else if (lowerText.includes('low') || lowerText.includes('later')) {
      return Priority.LOW
    }

    return null
  }

  private extractDeadline(text: string): string | null {
    // Try to parse dates
    const datePatterns = [
      /(?:on|by|before|due|deadline|today|tomorrow|yesterday) (?:the )?(\d{1,2})(?:st|nd|rd|th)? (?:of)? (?:the )?(january|february|march|april|may|june|july|august|september|october|november|december)/i,
      /(today|tomorrow|yesterday)/i,
      /(?:in|within|by) (\d+) (?:days?|weeks?|months?|years?)/i,
      /(?:next|following) (?:week|month|year)/i
    ]

    for (const pattern of datePatterns) {
      const match = text.match(pattern)
      if (match) {
        return this.parseDateFromMatch(match)
      }
    }

    return null
  }

  private extractDaysOfWeek(text: string): number[] | null {
    const dayMap: { [key: string]: number } = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6,
      sun: 0, mon: 1, tue: 2, wed: 3,
      thu: 4, fri: 5, sat: 6
    }

    const days: number[] = []
    const lowerText = text.toLowerCase()

    for (const [dayName, dayNum] of Object.entries(dayMap)) {
      if (lowerText.includes(dayName)) {
        days.push(dayNum)
      }
    }

    return days.length > 0 ? days : null
  }

  private cleanTaskTitle(text: string): string {
    let cleaned = text

    // Remove recurring patterns
    cleaned = cleaned.replace(/every (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi, '')
    cleaned = cleaned.replace(/every (week|month|year)/gi, '')
    cleaned = cleaned.replace(/daily|weekly|monthly|yearly/gi, '')

    // Remove dependency patterns
    cleaned = cleaned.replace(/after [^.,!?]+/gi, '')
    cleaned = cleaned.replace(/before [^.,!?]+/gi, '')

    // Remove context
    cleaned = cleaned.replace(/#[a-zA-Z0-9_]+/g, '')
    cleaned = cleaned.replace(/@\w+/g, '')

    // Remove time patterns
    cleaned = cleaned.replace(/(in|by|before|at) \d{1,2}(?::\d{2})? (?:pm|am|minutes?|hours)/gi, '')
    cleaned = cleaned.replace(/(today|tomorrow|yesterday)/gi, '')

    // Remove filler words
    cleaned = cleaned.replace(/^(?:the |a |an )+/i, '')
    cleaned = cleaned.replace(/^(?:please|can you|help me|create|make|add) /i, '')

    // Clean up extra spaces and punctuation
    cleaned = cleaned.replace(/\s+/g, ' ').trim()
    cleaned = cleaned.replace(/^\s*[,.;-]\s*/, '')
    cleaned = cleaned.replace(/\s*[,.;-]\s*$/, '')

    return cleaned
  }

  private parseDateFromMatch(match: RegExpMatchArray): string | null {
    const text = match[0]
    const lowerText = text.toLowerCase()

    // Handle today/tomorrow/yesterday
    if (lowerText === 'today') {
      return new Date().toISOString().split('T')[0]
    } else if (lowerText === 'tomorrow') {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow.toISOString().split('T')[0]
    } else if (lowerText === 'yesterday') {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      return yesterday.toISOString().split('T')[0]
    }

    // Handle relative times (in X days/weeks/months/years)
    const relativeMatch = text.match(/(?:in|within|by) (\d+) (days?|weeks?|months?|years?)/i)
    if (relativeMatch) {
      const amount = parseInt(relativeMatch[1])
      const unit = relativeMatch[2].toLowerCase()

      const date = new Date()
      switch (unit) {
        case 'day':
        case 'days':
          date.setDate(date.getDate() + amount)
          break
        case 'week':
        case 'weeks':
          date.setDate(date.getDate() + amount * 7)
          break
        case 'month':
        case 'months':
          date.setMonth(date.getMonth() + amount)
          break
        case 'year':
        case 'years':
          date.setFullYear(date.getFullYear() + amount)
          break
      }

      return date.toISOString().split('T')[0]
    }

    return null
  }

  private calculateConfidence(text: string, result: NaturalLanguageResult): number {
    let confidence = 0

    // Base confidence on text length and complexity
    if (text.length > 20) confidence += 30
    if (text.length > 50) confidence += 20

    // Add points for extracted elements
    if (result.task.dueDate) confidence += 15
    if (result.task.priority !== Priority.NORMAL) confidence += 10
    if (result.suggestions.length > 0) confidence += 10
    if (result.description) confidence += 10

    // Reduce confidence for vague titles
    if (result.task.title.length < 5) confidence -= 20

    return Math.max(0, Math.min(100, confidence))
  }
}