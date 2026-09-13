"use client"

import { useState, useEffect } from 'react'
import { useWorkspaceContext } from '@/src/contexts/WorkspaceContext'
import { useTaskContext } from '@/src/contexts'
import { Users, Edit, Plus, Trash2, CheckSquare, TrendingUp, Activity } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'task_created' | 'task_updated' | 'task_completed' | 'user_joined' | 'workspace_updated'
  user: {
    id: string
    name: string
    image?: string
  }
  action: string
  resource: {
    type: 'task' | 'workspace' | 'list' | 'comment'
    id: string
    name: string
  }
  timestamp: string
  workspaceId?: string
}

export default function ActivityFeed() {
  const { workspaces, currentWorkspace } = useWorkspaceContext()
  const { tasks } = useTaskContext()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()

    // Simulate real-time activity updates
    const interval = setInterval(() => {
      fetchActivities()
    }, 10000) // Poll every 10 seconds

    return () => clearInterval(interval)
  }, [currentWorkspace?.id])

  const fetchActivities = async () => {
    try {
      // Fetch activities for current workspace
      const response = await fetch(`/api/activity?workspaceId=${currentWorkspace?.id}`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'task_created':
        return <Plus className="w-4 h-4 text-green-600" />
      case 'task_updated':
        return <Edit className="w-4 h-4 text-blue-600" />
      case 'task_completed':
        return <CheckSquare className="w-4 h-4 text-purple-600" />
      case 'user_joined':
        return <Users className="w-4 h-4 text-orange-600" />
      case 'workspace_updated':
        return <TrendingUp className="w-4 h-4 text-cyan-600" />
      default:
        return <Edit className="w-4 h-4 text-gray-600" />
    }
  }

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'task_created':
        return 'bg-green-50 border-green-200'
      case 'task_updated':
        return 'bg-blue-50 border-blue-200'
      case 'task_completed':
        return 'bg-purple-50 border-purple-200'
      case 'user_joined':
        return 'bg-orange-50 border-orange-200'
      case 'workspace_updated':
        return 'bg-cyan-50 border-cyan-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <span className="text-sm text-gray-500">{activities.length} items</span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No activity yet</p>
            <p className="text-gray-400 text-xs">Activity will appear when teams work together</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className={`flex items-start space-x-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}
            >
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{activity.user.name}</span> {activity.action}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {activity.resource.name}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatTimeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={fetchActivities}
            className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Refresh activity
          </button>
        </div>
      )}
    </div>
  )
}