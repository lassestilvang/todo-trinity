"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface UserPresence {
  id: string
  name: string
  image?: string
  status: 'online' | 'away' | 'offline'
  lastSeen: string | null
}

export default function WorkspacePresence({ workspaceId }: { workspaceId?: string }) {
  const [presentUsers, setPresentUsers] = useState<UserPresence[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate real-time presence - in production, this would use WebSocket
    // or a service like Pusher/Supabase Realtime
    const fetchPresence = async () => {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/presence`)
        if (response.ok) {
          const data = await response.json()
          setPresentUsers(data.users || [])
        }
      } catch (error) {
        console.error('Failed to fetch presence:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPresence()

    // Poll for presence updates (replace with WebSocket in production)
    const interval = setInterval(fetchPresence, 30000) // Every 30 seconds

    // Set up activity tracking
    let idleTimer: NodeJS.Timeout
    let isIdle = false

    const resetIdleTimer = () => {
      clearTimeout(idleTimer)
      if (isIdle) {
        isIdle = false
        updatePresence('online')
      }
      idleTimer = setTimeout(() => {
        if (!isIdle) {
          isIdle = true
          updatePresence('away')
        }
      }, 5 * 60 * 1000) // 5 minutes idle
    }

    const updatePresence = async (status: 'online' | 'away') => {
      try {
        await fetch(`/api/workspaces/${workspaceId}/presence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
      } catch (error) {
        console.error('Failed to update presence:', error)
      }
    }

    // Events that reset the idle timer
    const events = ['mousemove', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, true)
    })

    resetIdleTimer()

    return () => {
      clearInterval(interval)
      clearTimeout(idleTimer)
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer, true)
      })
    }
  }, [workspaceId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'away':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="animate-pulse">Loading presence...</div>
      </div>
    )
  }

  if (presentUsers.length === 0) {
    return null
  }

  return (
    <div className="flex items-center space-x-3">
      <span className="text-xs text-gray-500">Online:</span>
      <div className="flex -space-x-2">
        {presentUsers.slice(0, 5).map((user) => (
          <div
            key={user.id}
            className="relative group"
            title={user.name}
          >
            <div
              className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center ${getStatusColor(user.status)}`}
            >
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-white ${getStatusColor(user.status)}`}
              title={user.status}
            />
          </div>
        ))}
        {presentUsers.length > 5 && (
          <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center">
            <span className="text-xs text-gray-500">+{presentUsers.length - 5}</span>
          </div>
        )}
      </div>
    </div>
  )
}
