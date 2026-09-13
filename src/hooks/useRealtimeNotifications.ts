"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRealtime } from './useRealtime'
import { useToast } from './useToast'

interface RealtimeNotification {
  id: string
  type: 'task_assigned' | 'task_updated' | 'task_completed' | 'comment_added' | 'mention' | 'workspace_invite'
  title: string
  message: string
  data: any
  timestamp: number
  read: boolean
}

export function useRealtimeNotifications(workspaceId?: string) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { events, presence, isConnected } = useRealtime(workspaceId)
  const { addToast } = useToast()

  useEffect(() => {
    // Convert realtime events to notifications
    const newNotifications: RealtimeNotification[] = events.map(event => ({
      id: event.id,
      type: mapEventToNotificationType(event.type),
      title: getNotificationTitle(event),
      message: getNotificationMessage(event),
      data: event,
      timestamp: event.timestamp,
      read: false
    }))

    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev].slice(0, 50))
      setUnreadCount(prev => prev + newNotifications.length)

      // Show toast for new events
      newNotifications.forEach(notification => {
        addToast(notification.title, 'info')
      })
    }
  }, [events, addToast])

  useEffect(() => {
    // Mark as read when user interacts
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User came back, could fetch latest
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    presence
  }
}

function mapEventToNotificationType(eventType: string): RealtimeNotification['type'] {
  switch (eventType) {
    case 'task_created':
      return 'task_assigned'
    case 'task_updated':
      return 'task_updated'
    case 'task_deleted':
      return 'task_updated'
    case 'task_completed':
      return 'task_completed'
    case 'task_commented':
      return 'comment_added'
    default:
      return 'task_updated'
  }
}

function getNotificationTitle(event: any): string {
  switch (event.type) {
    case 'task_created':
      return `New task: ${event.task?.title || 'Untitled'}`
    case 'task_updated':
      return `Task updated: ${event.task?.title || 'Untitled'}`
    case 'task_deleted':
      return `Task deleted`
    case 'task_completed':
      return `Task completed: ${event.task?.title || 'Untitled'}`
    case 'task_commented':
      return `New comment on: ${event.task?.title || 'Untitled'}`
    default:
      return `Task event: ${event.task?.title || 'Untitled'}`
  }
}

function getNotificationMessage(event: any): string {
  switch (event.type) {
    case 'task_created':
      return `A new task was created`
    case 'task_updated':
      if (event.task?.status) {
        return `Status changed to ${event.task.status}`
      }
      return `Task was updated`
    case 'task_deleted':
      return `A task was deleted`
    case 'task_completed':
      return `Task marked as complete`
    case 'task_commented':
      return `Someone commented on a task`
    default:
      return `Task event occurred`
  }
}