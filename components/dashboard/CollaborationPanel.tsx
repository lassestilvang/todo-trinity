"use client"

import { useEffect, useState } from 'react'
import { useRealtime } from '@/src/hooks/useRealtime'
import { useToast } from '@/src/hooks/useToast'
import type { Task, Priority } from '@/src/types/index'
import {
  User,
  MessageCircle,
  AlertTriangle,
  Zap,
  Shield,
  Layout,
  Palette,
  Clock,
  CheckCircle,
  Wifi,
  WifiOff
} from 'lucide-react'

interface RealtimeEvent {
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

interface UserPresence {
  userId: string
  status: 'online' | 'away' | 'offline'
  lastSeen: number
  currentTasks?: string[]
  workspaceId?: string
  page?: string
}

export default function CollaborationPanel({ workspaceId }: { workspaceId?: string }) {
  const { events, presence, isConnected, lastEvent } = useRealtime(workspaceId)
  const { addToast } = useToast()
  const [showDetails, setShowDetails] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<RealtimeEvent | null>(null)

  // Process events to show meaningful activities
  const recentActivities = events.slice(0, 10).map(event => ({
    ...event,
    timeAgo: formatTimeAgo(event.timestamp),
    description: getEventDescription(event),
    icon: getEventIcon(event.type)
  }))

  // Handle new events for toast notifications
  useEffect(() => {
    if (lastEvent) {
      // Show toast for important events
      if (['task_assigned', 'mention', 'conflict_detected'].includes(
        mapEventToActivityType(lastEvent.type)
      )) {
        addToast(
          getEventTitle(lastEvent),
          lastEvent.type === 'conflict_detected' ? 'warning' : 'info'
        )
      }
    }
  }, [lastEvent, addToast])

  const onlineUsers = presence.filter(p => p.status === 'online').length
  const awayUsers = presence.filter(p => p.status === 'away').length

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <h3 className="text-lg font-medium text-gray-900">
            Team Collaboration
          </h3>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-400 hover:text-gray-600"
        >
          {showDetails ? '−' : '+'}
          <span className="ml-1">Details</span>
        </button>
      </div>

      {/* Connection Status */}
      <div className={`flex items-center space-x-2 mb-3 p-2 rounded ${
        isConnected ? 'bg-green-50' : 'bg-red-50'
      }`}>
        {isConnected ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-red-500" />
        )}
        <span className="text-sm font-medium">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        <span className="ml-auto text-xs text-gray-500">
          {onlineUsers} online • {awayUsers} away
        </span>
      </div>

      {/* Activity Feed */}
      <div className="space-y-2 mb-4">
        {recentActivities.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <MessageCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentActivities.map(activity => (
              <div
                key={activity.id}
                className={`p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedEvent?.id === activity.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                }`}
                onClick={() => setSelectedEvent(activity)}
              >
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0">
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{getEventTitle(activity)}</p>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400">{activity.timeAgo}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Details */}
      {showDetails && selectedEvent && (
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center space-x-2 mb-2">
            {getEventIcon(selectedEvent.type)}
            <h4 className="text-lg font-medium text-gray-900">
              {getEventTitle(selectedEvent)}
            </h4>
          </div>

          <div className="text-gray-700 space-y-2">
            <p className="text-sm">{getEventDescription(selectedEvent)}</p>
            {selectedEvent.task && (
              <div className="border p-3 rounded mt-2">
                <p className="font-medium text-gray-900">{selectedEvent.task.title}</p>
                {selectedEvent.task.description && (
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                    {selectedEvent.task.description}
                  </p>
                )}
                {selectedEvent.oldPriority && selectedEvent.newPriority && (
                  <div className="flex items-center space-x-2 mt-2 text-xs">
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-200">
                      {selectedEvent.oldPriority}
                    </span>
                    <span className="text-gray-500">→</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                      {selectedEvent.newPriority}
                    </span>
                  </div>
                )}
                {selectedEvent.conflictId && (
                  <div className="mt-2">
                    <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">
                      Conflict: {selectedEvent.conflictId.substring(0, 8)}...
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-right">
            <button
              onClick={() => setSelectedEvent(null)}
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Team Presence */}
      <div className="mt-4 pt-3 border-t">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-700">Team Presence</span>
          </div>
          <span className="text-xs text-gray-500">
            {presence.length} members
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {presence.map(p => (
            <span
              key={p.userId}
              className={`px-2 py-1 text-xs rounded-full transition-colors ${
                p.status === 'online'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : p.status === 'away'
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={`${p.userId.substring(0, 8)}... - ${p.status === 'online' ? 'Online' : p.status === 'away' ? 'Away' : 'Offline'}${
                p.page ? ` • Viewing: ${p.page}` : ''
              }`}
            >
              {p.userId.substring(0, 6)}...
            </span>
          ))}
          {presence.length === 0 && (
            <span className="px-2 py-1 text-xs text-gray-400 italic">
              No team members
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper functions
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getEventIcon(eventType: string): JSX.Element {
  switch (eventType) {
    case 'task_created':
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case 'task_updated':
      return <MessageCircle className="w-4 h-4 text-blue-500" />
    case 'task_deleted':
      return <AlertTriangle className="w-4 h-4 text-red-500" />
    case 'task_commented':
      return <MessageCircle className="w-4 h-4 text-purple-500" />
    case 'task_completed':
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case 'priority_changed':
      return <Zap className="w-4 h-4 text-yellow-500" />
    case 'conflict_detected':
      return <Shield className="w-4 h-4 text-orange-500" />
    case 'user_joined':
      return <User className="w-4 h-4 text-blue-500" />
    case 'user_left':
      return <User className="w-4 h-4 text-gray-400" />
    default:
      return <AlertTriangle className="w-4 h-4 text-gray-400" />
  }
}

function getEventTitle(event: RealtimeEvent): string {
  switch (event.type) {
    case 'task_created':
      return `New task: ${event.task?.title || 'Untitled'}`
    case 'task_updated':
      return `Task updated: ${event.task?.title || 'Untitled'}`
    case 'task_deleted':
      return `Task deleted: ${event.taskId || 'Unknown'}`
    case 'task_commented':
      return `New comment on: ${event.task?.title || 'Untitled'}`
    case 'task_completed':
      return `Task completed: ${event.task?.title || 'Untitled'}`
    case 'priority_changed':
      return `Priority changed: ${event.task?.title || 'Untitled'}`
    case 'conflict_detected':
      return `Schedule conflict detected`
    case 'user_joined':
      return `Team member joined`
    case 'user_left':
      return `Team member left`
    default:
      return `Team activity`
  }
}

function getEventDescription(event: RealtimeEvent): string {
  switch (event.type) {
    case 'task_created':
      return `A new task was created`
    case 'task_updated':
      if (event.task?.status) {
        return `Status changed to ${event.task.status}`
      }
      if (event.oldPriority && event.newPriority) {
        return `Priority changed from ${event.oldPriority} to ${event.newPriority}`
      }
      return `Task was updated`
    case 'task_deleted':
      return `A task was deleted from the workspace`
    case 'task_commented':
      return `Someone added a comment to a task`
    case 'task_completed':
      return `Task marked as complete`
    case 'priority_changed':
      return `Task priority was updated`
    case 'conflict_detected':
      return `Schedule conflict requires attention`
    case 'user_joined':
      return `A team member came online`
    case 'user_left':
      return `A team member went offline`
    default:
      return `Team activity occurred`
  }
}

function mapEventToActivityType(eventType: string): string {
  switch (eventType) {
    case 'task_created':
      return 'task_created'
    case 'task_updated':
      return 'task_updated'
    case 'task_deleted':
      return 'task_deleted'
    case 'task_commented':
      return 'task_commented'
    case 'task_completed':
      return 'task_completed'
    case 'priority_changed':
      return 'priority_changed'
    case 'conflict_detected':
      return 'conflict_detected'
    case 'user_joined':
      return 'user_joined'
    case 'user_left':
      return 'user_left'
    default:
      return 'task_updated'
  }
}