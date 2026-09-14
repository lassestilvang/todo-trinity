"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { useTaskContext } from '@/src/contexts/TaskContext'
import type { Task, Priority } from '@/src/types/index'
import { TaskStatus } from '@/src/types/index'

export interface RealtimeEvent {
  id: string
  type:
    | 'task_created'
    | 'task_updated'
    | 'task_deleted'
    | 'task_commented'
    | 'task_completed'
    | 'priority_changed'
    | 'conflict_detected'
    | 'user_joined'
    | 'user_left'
  task?: Partial<Task>
  taskId?: string
  userId?: string
  timestamp: number
  oldPriority?: Priority
  newPriority?: Priority
  conflictId?: string
}

export interface UserPresence {
  userId: string
  status: 'online' | 'away' | 'offline'
  lastSeen: number
  currentTasks?: string[]
  workspaceId?: string
  page?: string
}

export interface RealtimeState {
  isConnected: boolean
  events: RealtimeEvent[]
  presence: UserPresence[]
  onlineUsers: number
  lastEvent?: RealtimeEvent
}

export function useRealtime(workspaceId?: string) {
  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    events: [],
    presence: [],
    onlineUsers: 0,
  })
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastEventIdRef = useRef<number>(0)
  const { updateTask, deleteTask } = useTaskContext()

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const params = new URLSearchParams()
    if (workspaceId) params.append('workspaceId', workspaceId)
    if (lastEventIdRef.current > 0) params.append('since', lastEventIdRef.current.toString())

    const eventSource = new EventSource(`/api/realtime?${params.toString()}`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setState(prev => ({ ...prev, isConnected: true }))
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'sync') {
          // Initial sync with missed events
          data.events.forEach((event: RealtimeEvent) => {
            lastEventIdRef.current = Math.max(lastEventIdRef.current, event.timestamp)
            handleEvent(event)
          })
        } else if (data.type === 'presence_update') {
          setState(prev => ({
            ...prev,
            presence: data.users || [],
            onlineUsers: data.users?.filter((u: UserPresence) => u.status === 'online').length || 0,
          }))
        } else {
          // Individual event
          lastEventIdRef.current = Math.max(lastEventIdRef.current, data.timestamp)
          handleEvent(data)
        }
      } catch (error) {
        console.error('Failed to parse realtime event:', error)
      }
    }

    eventSource.onerror = () => {
      setState(prev => ({ ...prev, isConnected: false }))
      eventSource.close()
      scheduleReconnect()
    }
  }, [workspaceId])

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    reconnectTimeoutRef.current = setTimeout(() => {
      connect()
    }, 5000)
  }, [connect])

  const handleEvent = useCallback((event: RealtimeEvent) => {
    setState(prev => ({
      ...prev,
      events: [event, ...prev.events].slice(0, 100),
      lastEvent: event,
    }))

    // Handle task updates in local state
    switch (event.type) {
      case 'task_created':
        if (event.task) {
          // The task will be fetched via the regular API
          // We just invalidate the cache
          console.log('Task created:', event.task.id)
        }
        break

      case 'task_updated':
        if (event.task && event.task.id) {
          // Update local task state
          updateTask(event.task.id, event.task as Partial<Task>)
        }
        break

      case 'task_deleted':
        if (event.taskId) {
          deleteTask(event.taskId)
        }
        break

      case 'task_completed':
        if (event.task && event.task.id) {
          updateTask(event.task.id, { status: TaskStatus.COMPLETED, completedAt: event.task.completedAt })
        }
        break

      case 'priority_changed':
        if (event.task && event.task.id && event.newPriority) {
          updateTask(event.task.id, { priority: event.newPriority })
        }
        break

      case 'conflict_detected':
        // Conflicts will be detected via the conflict detection API
        console.log('Conflict detected:', event.conflictId)
        break

      case 'user_joined':
        console.log('User joined:', event.userId)
        break

      case 'user_left':
        console.log('User left:', event.userId)
        break
    }
  }, [updateTask, deleteTask])

  // Update user presence
  const updatePresence = useCallback(async (page?: string, workspaceId?: string) => {
    try {
      await fetch('/api/realtime/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, workspaceId }),
      })
    } catch (error) {
      console.error('Failed to update presence:', error)
    }
  }, [])

  // Subscribe to a specific task
  const subscribeToTask = useCallback((taskId: string) => {
    // Track current task in presence
    updatePresence(undefined, workspaceId)
  }, [updatePresence, workspaceId])

  // Unsubscribe from a task
  const unsubscribeFromTask = useCallback((taskId: string) => {
    // Would need to implement task-specific unsubscription
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    connect()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connect])

  // Update presence on page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePresence()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [updatePresence])

  return {
    ...state,
    connect,
    disconnect: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      setState(prev => ({ ...prev, isConnected: false }))
    },
    updatePresence,
    subscribeToTask,
    unsubscribeFromTask,
  }
}

export default useRealtime