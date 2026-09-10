"use client"

import { useEffect, useState } from 'react'
import { useRealtimeNotifications } from '@/src/hooks/useRealtimeNotifications'
import { Wifi, WifiOff, Users, Bell, CheckCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export default function RealtimeStatus({ workspaceId }: { workspaceId?: string }) {
  const { unreadCount, isConnected, presence, notifications, markAllAsRead, clearNotifications } = useRealtimeNotifications(workspaceId)
  const [showDropdown, setShowDropdown] = useState(false)

  const onlineCount = presence.filter(p => p.status === 'online').length
  const awayCount = presence.filter(p => p.status === 'away').length

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${
          isConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}
        title={isConnected ? 'Connected to real-time' : 'Disconnected from real-time'}
      >
        {isConnected ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="text-xs font-medium hidden sm:inline">
          {isConnected ? 'Live' : 'Offline'}
        </span>
        {unreadCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border z-50 animate-slide-down">
          <div className="p-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Real-time Status</h3>
            <button
              onClick={() => setShowDropdown(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Connection Status */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <div>
                <p className="text-xs font-medium text-gray-700">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </p>
                <p className="text-xs text-gray-500">
                  {isConnected ? 'Receiving live updates' : 'Attempting to reconnect...'}
                </p>
              </div>
            </div>
          </div>

          {/* Presence */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-700">Team Presence</span>
            </div>
            <div className="flex space-x-2">
              <div className="flex-1 bg-green-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-green-600">{onlineCount}</p>
                <p className="text-xs text-green-600">Online</p>
              </div>
              <div className="flex-1 bg-yellow-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-yellow-600">{awayCount}</p>
                <p className="text-xs text-yellow-600">Away</p>
              </div>
            </div>
            {presence.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                {presence.slice(0, 8).map(p => (
                  <span
                    key={p.userId}
                    className={`px-2 py-1 text-xs rounded-full ${
                      p.status === 'online' ? 'bg-green-100 text-green-700' :
                      p.status === 'away' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}
                    title={p.page ? `Viewing: ${p.page}` : 'Active'}
                  >
                    {p.userId.substring(0, 8)}...
                  </span>
                ))}
                {presence.length > 8 && (
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-500">
                    +{presence.length - 8} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Notifications */}
          {unreadCount > 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center space-x-2 mb-2">
                <Bell className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">Unread Notifications ({unreadCount})</span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {notifications.slice(0, 5).map(n => (
                  <div
                    key={n.id}
                    className={`px-2 py-1.5 rounded text-xs ${
                      n.read ? 'bg-gray-50' : 'bg-blue-50'
                    } border-l-2 ${n.read ? 'border-gray-200' : 'border-blue-500'}`}
                  >
                    <p className="font-medium text-gray-800">{n.title}</p>
                    <p className="text-gray-500">{n.message}</p>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={markAllAsRead}
                  className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Mark All Read
                </button>
                <button
                  onClick={clearNotifications}
                  className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <div className="p-3 text-center text-xs text-gray-500">
            Real-time updates powered by Server-Sent Events
          </div>
        </div>
      )}
    </div>
  )
}