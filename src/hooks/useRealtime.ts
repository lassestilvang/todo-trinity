"use client"

import { useEffect, useState, useCallback } from 'react'

interface TaskEvent {
  id: string
  type: 'task_created' | 'task_updated' | 'task_deleted' | 'task_completed' | 'task_commented'
  task?: {
    id: string
    title: string
    description?: string
    status: string
    priority?: string
    dueDate?: string
    completedAt?: string
    listId?: string
  }
  taskId: string
  userId?: string
  timestamp: number
}

interface UserPresence {
  userId: string
  status: 'online' | 'away' | 'offline'
  lastSeen: number
  currentTasks: string[]
  workspaceId?: string
  page?: string
}

interface RealtimeEvents {
  events: TaskEvent[]
  presence: UserPresence[]
}

export function useRealtime(workspaceId?: string, userId?: string) {
  const [events, setEvents] = useState<TaskEvent[]>([])
  const [presence, setPresence] = useState<UserPresence[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    let reconnectAttempts = 0
    const maxReconnectAttempts = 10
    const baseReconnectDelay = 3000
    let source: EventSource | null = null

    const connect = () => {
      setIsConnected(true)
      setError(null)

      try {
        const url = `/api/realtime?workspaceId=${workspaceId || ''}&userId=${userId}`
        source = new EventSource(url)

        source.onopen = () => {
          setIsConnected(true)
          reconnectAttempts = 0
        }

        source.onerror = (event) => {
          setIsConnected(false)
          console.error('SSE error:', event)
          source?.close()
          attemptReconnect()
        }

        source.onmessage = (event) => {
          try {
            const data = event.data

            // Handle heartbeat
            if (data === ': heartbeat') {
              return
            }

            // Handle presence updates
            if (data.startsWith('presence:')) {
              const presenceData = data.replace('presence:', '')
              const parsed = JSON.parse(presenceData)
              setPresence(prev => {
                // Remove old entry and add/update
                const existingIndex = prev.findIndex(p => p.userId === parsed.userId)
                if (existingIndex >= 0) {
                  return [...prev.slice(0, existingIndex), parsed, ...prev.slice(existingIndex + 1)]
                }
                return [parsed, ...prev].slice(0, 50)
              })
              return
            }

            // Handle sync message
            if (data.startsWith('data: ')) {
              const parsed = JSON.parse(data.replace('data: ', ''))

              if (parsed.type === 'sync') {
                // Send missed events
                setEvents(parsed.events || [])
              } else {
                // Regular event
                setEvents(prev => {
                  const newEvent = parsed as TaskEvent
                  // Avoid duplicates
                  if (!prev.some(e => e.id === newEvent.id)) {
                    return [newEvent, ...prev].slice(0, 50)
                  }
                  return prev
                })
              }
            }
          } catch (err) {
            console.error('Failed to parse SSE message:', err)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect')
        setIsConnected(false)
        attemptReconnect()
      }
    }

    const attemptReconnect = () => {
      if (reconnectAttempts >= maxReconnectAttempts) {
        setError('Max reconnection attempts reached')
        setIsConnected(false)
        return
      }

      reconnectAttempts++
      const delay = baseReconnectDelay * reconnectAttempts

      setTimeout(() => {
        connect()
      }, delay)
    }

    connect()

    return () => {
      source?.close()
    }
  }, [userId, workspaceId])

  return {
    events,
    presence,
    isConnected,
    error,
    totalEvents: events.length,
    unreadCount: events.filter(e => new Date().getTime() - e.timestamp < 60000).length
  }
}