import { prisma } from '@/lib/prisma'

interface TaskSuggestion {
  title: string
  description?: string
  suggestedPriority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  suggestedListId?: string
  confidence: number
  reason: string
}

export async function getTaskSuggestions(userId: string): Promise<TaskSuggestion[]> {
  const suggestions: TaskSuggestion[] = []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const monthAgo = new Date(today)
  monthAgo.setDate(monthAgo.getDate() - 30)

  const recentTasks = await prisma.task.findMany({
    where: {
      userId,
      createdAt: { gte: monthAgo },
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueDate: true,
      listId: true,
      createdAt: true,
      completedAt: true,
      list: {
        select: { id: true, name: true },
      },
      labels: {
        select: { id: true, name: true },
      },
    },
  })

  const completedTasks = recentTasks.filter(t => t.status === 'COMPLETED')
  const pendingTasks = recentTasks.filter(t => t.status !== 'COMPLETED')

  const overdueTasks = pendingTasks.filter(t => t.dueDate && new Date(t.dueDate) < today)
  if (overdueTasks.length > 0) {
    suggestions.push({
      title: `Review ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`,
      description: 'You have overdue tasks that need attention',
      suggestedPriority: 'HIGH',
      confidence: 0.9,
      reason: 'Overdue tasks detected',
    })
  }

  const recurringPatterns = findRecurringPatterns(recentTasks)
  for (const pattern of recurringPatterns) {
    const lastOccurrence = pattern.tasks[0]
    const daysSinceLast = Math.floor((today.getTime() - new Date(lastOccurrence.createdAt).getTime()) / 86400000)
    const expectedInterval = pattern.interval

    if (daysSinceLast >= expectedInterval * 0.8) {
      suggestions.push({
        title: lastOccurrence.title,
        description: lastOccurrence.description,
        suggestedPriority: lastOccurrence.priority,
        suggestedListId: lastOccurrence.listId,
        confidence: Math.min(0.8, 0.5 + (expectedInterval - daysSinceLast) * 0.1),
        reason: `Recurring pattern: ${pattern.name}`,
      })
    }
  }

  const highPriorityPending = pendingTasks.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT')
  if (highPriorityPending.length > 0) {
    suggestions.push({
      title: `Focus on ${highPriorityPending.length} high priority task${highPriorityPending.length > 1 ? 's' : ''}`,
      description: 'High priority tasks are waiting',
      suggestedPriority: 'HIGH',
      confidence: 0.85,
      reason: 'High priority tasks pending',
    })
  }

  const emptyListDays = getDaysSinceLastListCreation(recentTasks)
  if (emptyListDays > 14) {
    suggestions.push({
      title: 'Create a new project list',
      description: 'It\'s been a while since you created a new list',
      suggestedPriority: 'LOW',
      confidence: 0.6,
      reason: 'No new lists created recently',
    })
  }

  const workHours = [9, 10, 11, 14, 15, 16]
  const currentHour = new Date().getHours()
  if (workHours.includes(currentHour) && pendingTasks.length > 0) {
    const workTasks = pendingTasks.filter(t => t.list?.name.toLowerCase().includes('work'))
    if (workTasks.length > 0) {
      const firstTask = workTasks[0]
      suggestions.push({
        title: `Complete "${firstTask.title}"`,
        description: 'Work task ready for attention',
        suggestedPriority: firstTask.priority,
        suggestedListId: firstTask.listId || undefined,
        confidence: 0.75,
        reason: 'Work hours and pending work tasks',
      })
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5)
}

function findRecurringPatterns(tasks: any[]): Array<{ name: string; interval: number; tasks: any[] }> {
  const patterns: Map<string, { tasks: any[]; dates: Date[] }> = new Map()

  for (const task of tasks) {
    const key = task.title.toLowerCase().trim()
    if (!patterns.has(key)) {
      patterns.set(key, { tasks: [], dates: [] })
    }
    const pattern = patterns.get(key)!
    pattern.tasks.push(task)
    if (task.completedAt) {
      pattern.dates.push(new Date(task.completedAt))
    }
  }

  const recurring: Array<{ name: string; interval: number; tasks: any[] }> = []

  Array.from(patterns.entries()).forEach(([name, data]) => {
    if (data.dates.length < 2) return

    const sortedDates = data.dates.sort((a, b) => a.getTime() - b.getTime())
    let totalInterval = 0
    let intervals = 0

    for (let i = 1; i < sortedDates.length; i++) {
      const diff = (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / 86400000
      totalInterval += diff
      intervals++
    }

    const avgInterval = totalInterval / intervals
    if (avgInterval >= 1 && avgInterval <= 30 && intervals >= 2) {
      recurring.push({
        name,
        interval: Math.round(avgInterval),
        tasks: data.tasks,
      })
    }
  })

  return recurring
}

function getDaysSinceLastListCreation(tasks: any[]): number {
  const listCreationDates = new Map<string, Date>()

  for (const task of tasks) {
    if (task.listId && !listCreationDates.has(task.listId)) {
      listCreationDates.set(task.listId, new Date(task.createdAt))
    }
  }

  const latest = Math.max(...Array.from(listCreationDates.values()).map(d => d.getTime()))
  if (!latest) return 999

  return Math.floor((Date.now() - latest) / 86400000)
}

export function parseNaturalLanguage(input: string, userId: string): {
  title: string
  description?: string
  dueDate?: Date
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  listId?: string
} | null {
  const normalized = input.toLowerCase().trim()
  if (!normalized) return null

  const title = input.trim()
  let description = ''
  let dueDate: Date | undefined
  let priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'

  const urgentKeywords = ['urgent', 'asap', 'immediately', 'now', 'critical']
  const highKeywords = ['important', 'high priority', 'soon', 'today']
  const lowKeywords = ['someday', 'later', 'low priority', 'when possible']

  if (urgentKeywords.some(k => normalized.includes(k))) priority = 'URGENT'
  else if (highKeywords.some(k => normalized.includes(k))) priority = 'HIGH'
  else if (lowKeywords.some(k => normalized.includes(k))) priority = 'LOW'

  const timePatterns = [
    { regex: /today/, days: 0 },
    { regex: /tomorrow/, days: 1 },
    { regex: /in (\d+) day/, days: (m: RegExpMatchArray) => parseInt(m[1]) },
    { regex: /in (\d+) week/, days: (m: RegExpMatchArray) => parseInt(m[1]) * 7 },
    { regex: /next (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/, days: (m: RegExpMatchArray) => getDaysUntilDay(m[1]) },
    { regex: /(\d{1,2})\/(\d{1,2})/, days: (m: RegExpMatchArray) => {
      const month = parseInt(m[1]) - 1
      const day = parseInt(m[2])
      const date = new Date()
      date.setMonth(month, day)
      if (date < new Date()) date.setFullYear(date.getFullYear() + 1)
      return Math.floor((date.getTime() - Date.now()) / 86400000)
    }},
  ]

  for (const { regex, days } of timePatterns) {
    const match = normalized.match(regex)
    if (match) {
      const dayOffset = typeof days === 'function' ? days(match) : days
      dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + dayOffset)
      dueDate.setHours(23, 59, 59, 999)
      break
    }
  }

  return { title, description, dueDate, priority }
}

function getDaysUntilDay(dayName: string): number {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const target = days.indexOf(dayName.toLowerCase())
  if (target === -1) return 7

  const today = new Date().getDay()
  let diff = target - today
  if (diff <= 0) diff += 7
  return diff
}