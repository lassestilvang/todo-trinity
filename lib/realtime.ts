import type { Task } from '@/src/types/index'

// In-memory store for real-time events (in production, use Redis or similar)
const recentEvents: Array<{
  id: string
  type: 'task_created' | 'task_updated' | 'task_deleted'
  task?: Partial<Task>
  taskId?: string
  timestamp: number
}> = []

const MAX_EVENTS = 50

export function broadcastTaskCreate(task: any): void {
  const event: {
    id: string
    type: 'task_created' | 'task_updated' | 'task_deleted'
    task?: Partial<Task>
    taskId?: string
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
    timestamp: Date.now(),
  }

  recentEvents.push(event)
  if (recentEvents.length > MAX_EVENTS) {
    recentEvents.shift()
  }
}

export function broadcastTaskUpdate(task: any): void {
  const event: {
    id: string
    type: 'task_created' | 'task_updated' | 'task_deleted'
    task?: Partial<Task>
    taskId?: string
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
    timestamp: Date.now(),
  }

  recentEvents.push(event)
  if (recentEvents.length > MAX_EVENTS) {
    recentEvents.shift()
  }
}

export function broadcastTaskDelete(taskId: string): void {
  const event: {
    id: string
    type: 'task_created' | 'task_updated' | 'task_deleted'
    task?: Partial<Task>
    taskId?: string
    timestamp: number
  } = {
    id: crypto.randomUUID(),
    type: 'task_deleted',
    taskId,
    timestamp: Date.now(),
  }

  recentEvents.push(event)
  if (recentEvents.length > MAX_EVENTS) {
    recentEvents.shift()
  }
}

export function getRecentEvents(since: number = 0): Array<{
  id: string
  type: 'task_created' | 'task_updated' | 'task_deleted'
  task?: Partial<Task>
  taskId?: string
  timestamp: number
}> {
  return recentEvents.filter(event => event.timestamp > since)
}