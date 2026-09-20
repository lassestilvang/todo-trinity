"use client"

import { Task, TaskStatus, Priority } from '@/src/types/index'

export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  location?: string
  attendees?: Array<{ email: string; responseStatus: string }>
  reminders?: {
    useDefault: boolean
    overrides?: Array<{ method: string; minutes: number }>
  }
  extendedProperties?: {
    private?: {
      todoTrinityTaskId?: string
      syncedFrom?: string
    }
  }
}

export interface CalendarSyncConfig {
  provider: 'google' | 'outlook' | 'apple'
  accessToken?: string
  refreshToken?: string
  calendarId?: string
  syncEnabled: boolean
  syncDirection: 'bidirectional' | 'tasks_to_calendar' | 'calendar_to_tasks'
  lastSync?: Date | string
  conflictStrategy: 'newest_wins' | 'tasks_win' | 'calendar_win' | 'manual'
}

export interface SyncResult {
  eventsFound: number
  tasksCreated: number
  tasksUpdated: number
  eventsCreated: number
  eventsUpdated: number
  conflicts: Array<{
    type: 'task_vs_event'
    taskId: string
    eventId: string
    field: 'title' | 'description' | 'start' | 'end'
    taskValue: any
    eventValue: any
    resolution: 'task' | 'event' | 'manual'
  }>
  errors: string[]
}

export class CalendarIntegration {
  private config: CalendarSyncConfig
  private userId: string

  constructor(userId: string, config: CalendarSyncConfig) {
    this.userId = userId
    this.config = config
  }

  async sync(tasks: Task[]): Promise<SyncResult> {
    const result: SyncResult = {
      eventsFound: 0,
      tasksCreated: 0,
      tasksUpdated: 0,
      eventsCreated: 0,
      eventsUpdated: 0,
      conflicts: [],
      errors: []
    }

    try {
      // Fetch events from calendar
      const events = await this.fetchCalendarEvents()
      result.eventsFound = events.length

      if (this.config.syncDirection === 'bidirectional' || this.config.syncDirection === 'calendar_to_tasks') {
        // Sync calendar events to tasks
        await this.syncEventsToTasks(events, tasks, result)
      }

      if (this.config.syncDirection === 'bidirectional' || this.config.syncDirection === 'tasks_to_calendar') {
        // Sync tasks to calendar events
        await this.syncTasksToEvents(tasks, events, result)
      }

      // Update last sync timestamp
      this.config.lastSync = new Date().toISOString()

      return result
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown sync error')
      return result
    }
  }

  private async fetchCalendarEvents(): Promise<CalendarEvent[]> {
    // In production, this would call Google Calendar API, Microsoft Graph API, etc.
    // For now, return mock data
    return []
  }

  private async syncEventsToTasks(
    events: CalendarEvent[],
    existingTasks: Task[],
    result: SyncResult
  ): Promise<void> {
    for (const event of events) {
      // Check if event already synced to a task
      const existingTaskId = event.extendedProperties?.private?.todoTrinityTaskId
      let task = existingTaskId ? existingTasks.find(t => t.id === existingTaskId) : null

      // If no existing task, try to find by title/time match
      if (!task) {
        task = this.findMatchingTask(event, existingTasks)
      }

      if (task) {
        // Update existing task
        const hasChanges = await this.updateTaskFromEvent(task, event)
        if (hasChanges) {
          result.tasksUpdated++
        }
      } else {
        // Create new task from event
        await this.createTaskFromEvent(event)
        result.tasksCreated++
      }
    }
  }

  private async syncTasksToEvents(
    tasks: Task[],
    existingEvents: CalendarEvent[],
    result: SyncResult
  ): Promise<void> {
    for (const task of tasks) {
      // Only sync tasks with due dates
      if (!task.dueDate) continue

      // Check if task already synced to an event
      const existingEvent = existingEvents.find(
        e => e.extendedProperties?.private?.todoTrinityTaskId === task.id
      )

      if (existingEvent) {
        // Update existing event
        const hasChanges = await this.updateEventFromTask(existingEvent, task)
        if (hasChanges) {
          result.eventsUpdated++
        }
      } else {
        // Create new event from task
        await this.createEventFromTask(task)
        result.eventsCreated++
      }
    }
  }

  private findMatchingTask(event: CalendarEvent, tasks: Task[]): Task | null {
    // Simple matching by title and time
    for (const task of tasks) {
      if (!task.dueDate) continue

      const eventStart = event.start.dateTime ? new Date(event.start.dateTime) : event.start.date ? new Date(event.start.date) : null
      const taskDue = new Date(task.dueDate)

      // Match if titles are similar and times are close (within 1 hour)
      if (eventStart && taskDue) {
        const timeDiff = Math.abs(eventStart.getTime() - taskDue.getTime()) / (1000 * 60 * 60)
        const titleSimilar = this.calculateSimilarity(event.summary, task.title) > 0.7

        if (timeDiff < 1 && titleSimilar) {
          return task
        }
      }
    }
    return null
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase()
    const s2 = str2.toLowerCase()

    if (s1 === s2) return 1

    const longer = s1.length > s2.length ? s1 : s2
    const shorter = s1.length > s2.length ? s2 : s1

    if (longer.length === 0) return 1

    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  private async updateTaskFromEvent(task: Task, event: CalendarEvent): Promise<boolean> {
    let hasChanges = false
    const updates: Partial<Task> = {}

    if (event.summary && event.summary !== task.title) {
      updates.title = event.summary
      hasChanges = true
    }

    if (event.description && event.description !== task.description) {
      updates.description = event.description
      hasChanges = true
    }

    if (event.start.dateTime) {
      const eventStart = new Date(event.start.dateTime)
      if (task.dueDate && new Date(task.dueDate).getTime() !== eventStart.getTime()) {
        updates.dueDate = eventStart.toISOString()
        hasChanges = true
      }
    }

    // In production, would call API to update task
    // await api.updateTask(task.id, updates)

    return hasChanges
  }

  private async createTaskFromEvent(event: CalendarEvent): Promise<Task | null> {
    if (!event.start.dateTime && !event.start.date) return null

    const startTimeStr = event.start.dateTime || event.start.date || ''
    const startTime = startTimeStr ? new Date(startTimeStr) : new Date()
    const endTimeStr = event.end.dateTime || event.end.date || ''
    const endTime = endTimeStr ? new Date(endTimeStr) : new Date(startTime.getTime() + 60 * 60 * 1000)

    const taskData: Partial<Task> = {
      title: event.summary || 'Calendar Event',
      description: event.description || '',
      dueDate: startTime.toISOString(),
      status: TaskStatus.TODO,
      priority: Priority.NORMAL,
    }

    // In production, would call API to create task
    // const task = await api.createTask(taskData)
    // return task

    return null
  }

  private async updateEventFromTask(event: CalendarEvent, task: Task): Promise<boolean> {
    let hasChanges = false

    if (task.title && task.title !== event.summary) {
      // In production, would update event via API
      hasChanges = true
    }

    if (task.description && task.description !== event.description) {
      hasChanges = true
    }

    if (task.dueDate) {
      const taskDue = new Date(task.dueDate)
      const eventStart = event.start.dateTime ? new Date(event.start.dateTime) : event.start.date ? new Date(event.start.date) : null

      if (eventStart && taskDue.getTime() !== eventStart.getTime()) {
        hasChanges = true
      }
    }

    // In production, would call API to update event
    // await calendarApi.updateEvent(event.id, updates)

    return hasChanges
  }

  private async createEventFromTask(task: Task): Promise<CalendarEvent | null> {
    if (!task.dueDate) return null

    const startTime = new Date(task.dueDate)
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour default

    const eventData: CalendarEvent = {
      id: `temp_${Date.now()}`,
      summary: task.title,
      description: task.description || '',
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      extendedProperties: {
        private: {
          todoTrinityTaskId: task.id,
          syncedFrom: 'tasks'
        }
      }
    }

    // In production, would call API to create event
    // const event = await calendarApi.createEvent(eventData)
    // return event

    return null
  }

  // OAuth helpers
  static async getAuthUrl(provider: 'google' | 'outlook', redirectUri: string): Promise<string> {
    const scopes = provider === 'google'
      ? ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events']
      : ['https://graph.microsoft.com/Calendars.ReadWrite']

    const params = new URLSearchParams({
      client_id: process.env[`${provider.toUpperCase()}_CLIENT_ID`] || '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state: provider
    })

    const authUrl = provider === 'google'
      ? 'https://accounts.google.com/o/oauth2/v2/auth'
      : 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'

    return `${authUrl}?${params.toString()}`
  }

  static async exchangeCodeForTokens(provider: 'google' | 'outlook', code: string, redirectUri: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const params = new URLSearchParams({
      client_id: process.env[`${provider.toUpperCase()}_CLIENT_ID`] || '',
      client_secret: process.env[`${provider.toUpperCase()}_CLIENT_SECRET`] || '',
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })

    const tokenUrl = provider === 'google'
      ? 'https://oauth2.googleapis.com/token'
      : 'https://login.microsoftonline.com/common/oauth2/v2.0/token'

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error_description || 'Failed to exchange code for tokens')
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in
    }
  }

  static async refreshAccessToken(provider: 'google' | 'outlook', refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    const params = new URLSearchParams({
      client_id: process.env[`${provider.toUpperCase()}_CLIENT_ID`] || '',
      client_secret: process.env[`${provider.toUpperCase()}_CLIENT_SECRET`] || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })

    const tokenUrl = provider === 'google'
      ? 'https://oauth2.googleapis.com/token'
      : 'https://login.microsoftonline.com/common/oauth2/v2.0/token'

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error_description || 'Failed to refresh access token')
    }

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in
    }
  }
}