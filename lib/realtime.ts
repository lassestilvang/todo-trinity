import type { Task } from '@/src/types/index'

// In-memory store for real-time events (in production, use Redis or similar)
const recentEvents: Array<{
  id: string
  type: 'task_created' | 'task_updated' | 'task_deleted' | 'task_commented' | 'task_completed'
  task?: Partial<Task>
  taskId?: string
  userId?: string
  timestamp: number
}> = []

const MAX_EVENTS = 100

// User presence tracking
const userPresence: Map<string, {
  userId: string
  status: 'online' | 'away' | 'offline'
  lastSeen: number
  currentTasks: string[]
  workspaceId?: string
  page?: string
}> = new Map()

const ACTIVITY_TIMEOUT = 30000 // 30 seconds before marking user as offline

export function broadcastTaskCreate(task: any, userId?: string): void {
  const event: {
    id: string
    type: 'task_created' | 'task_updated' | 'task_deleted' | 'task_commented' | 'task_completed'
    task?: Partial<Task>
    taskId?: string
    userId?: string
    timestamp: number
  } = {
    id: crypto.randomUUID(),
    type: 'task_created',
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      listId: task.listId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    },
    userId,
    timestamp: Date.now(),
  }

  recentEvents.push(event)
  if (recentEvents.length > MAX_EVENTS) {
    recentEvents.shift()
  }

  // Update user presence
  if (userId) {
    updateUserPresenceInternal(userId, 'online', new Date().getTime())
  }
}

export function broadcastTaskUpdate(task: any, userId?: string): void {
  const event: {
    id: string
    type: 'task_created' | 'task_updated' | 'task_deleted' | 'task_commented' | 'task_completed'
    task?: Partial<Task>
    taskId?: string
    userId?: string
    timestamp: number
  } = {
    id: crypto.randomUUID(),
    type: 'task_updated',
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      listId: task.listId,
      updatedAt: task.updatedAt,
    },
    userId,
    timestamp: Date.now(),
  }

  recentEvents.push(event)
  if (recentEvents.length > MAX_EVENTS) {
    recentEvents.shift()
  }

  // Update user presence
  if (userId) {
    updateUserPresenceInternal(userId, 'online', new Date().getTime())
  }
}

export function broadcastTaskDelete(taskId: string, userId?: string): void {
  const event: {
    id: string
    type: 'task_created' | 'task_updated' | 'task_deleted' | 'task_commented' | 'task_completed'
    task?: Partial<Task>
    taskId?: string
    userId?: string
    timestamp: number
  } = {
    id: crypto.randomUUID(),
    type: 'task_deleted',
    taskId,
    userId,
    timestamp: Date.now(),
  }

  recentEvents.push(event)
  if (recentEvents.length > MAX_EVENTS) {
    recentEvents.shift()
  }

  // Update user presence
  if (userId) {
    updateUserPresenceInternal(userId, 'online', new Date().getTime())
  }
}

export function broadcastTaskComplete(task: any, userId?: string): void {
  const event: {
    id: string
    type: 'task_created' | 'task_updated' | 'task_deleted' | 'task_commented' | 'task_completed'
    task?: Partial<Task>
    taskId?: string
    userId?: string
    timestamp: number
  } = {
    id: crypto.randomUUID(),
    type: 'task_completed',
    task: {
      id: task.id,
      title: task.title,
      status: task.status,
      completedAt: task.completedAt,
    },
    userId,
    timestamp: Date.now(),
  }

  recentEvents.push(event)
  if (recentEvents.length > MAX_EVENTS) {
    recentEvents.shift()
  }

  // Update user presence
  if (userId) {
    updateUserPresenceInternal(userId, 'online', new Date().getTime())
  }
}

export function broadcastTaskComment(task: any, userId?: string): void {
  const event: {
    id: string
    type: 'task_created' | 'task_updated' | 'task_deleted' | 'task_commented' | 'task_completed'
    task?: Partial<Task>
    taskId?: string
    userId?: string
    timestamp: number
  } = {
    id: crypto.randomUUID(),
    type: 'task_commented',
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
    },
    userId,
    timestamp: Date.now(),
  }

  recentEvents.push(event)
  if (recentEvents.length > MAX_EVENTS) {
    recentEvents.shift()
  }

  // Update user presence
  if (userId) {
    updateUserPresenceInternal(userId, 'online', new Date().getTime())
  }
}

function updateUserPresenceInternal(userId: string, status: 'online' | 'away' | 'offline', timestamp: number): void {
  const current = userPresence.get(userId)

  if (status === 'offline') {
    userPresence.delete(userId)
  } else {
    userPresence.set(userId, {
      ...current,
      userId,
      status,
      lastSeen: timestamp,
      currentTasks: current?.currentTasks || [],
    })
  }

  // Cleanup offline users every minute
  setTimeout(cleanupInactiveUsers, 60000)
}

function cleanupInactiveUsers(): void {
  const now = Date.now()
  Array.from(userPresence.entries()).forEach(([userId, presence]) => {
    if (presence.status === 'online' && now - presence.lastSeen > ACTIVITY_TIMEOUT) {
      userPresence.set(userId, {
        ...presence,
        status: 'away'
      })
    } else if (presence.status === 'away' && now - presence.lastSeen > ACTIVITY_TIMEOUT * 2) {
      userPresence.delete(userId)
    }
  })
}

export function updateUserPresence(userId: string, page?: string, workspaceId?: string): void {
  const current = userPresence.get(userId) || {}
  userPresence.set(userId, {
    ...current,
    userId,
    status: 'online',
    lastSeen: Date.now(),
    currentTasks: current?.currentTasks || [],
    page,
    workspaceId
  })
}

export function getRecentEvents(since: number = 0, userId?: string): Array<{
  id: string
  type: 'task_created' | 'task_updated' | 'task_deleted' | 'task_commented' | 'task_completed'
  task?: Partial<Task>
  taskId?: string
  userId?: string
  timestamp: number
}> {
  let events = recentEvents.filter(event => event.timestamp > since)

  if (userId) {
    events = events.filter(event => event.userId === userId)
  }

  return events
}

export function getUserPresence(workspaceId?: string): Array<{
  userId: string
  status: 'online' | 'away' | 'offline'
  lastSeen: number
  currentTasks: string[]
  workspaceId?: string
  page?: string
}> {
  const users = Array.from(userPresence.values())

  if (workspaceId) {
    return users.filter(u => u.workspaceId === workspaceId)
  }

  return users
}

export function getUserPresenceByUserId(userId: string): {
  userId: string
  status: 'online' | 'away' | 'offline'
  lastSeen: number
  currentTasks: string[]
  workspaceId?: string
  page?: string
} | undefined {
  return userPresence.get(userId)
}