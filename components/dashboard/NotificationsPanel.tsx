"use client"

import { useTaskContext } from '@/src/hooks/useTasks'
import { useNotifications } from '@/src/hooks/useLists'

export default function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { notifications, loading, error } = useNotifications()

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center p-4">
        <div className="bg-white rounded-xl p-6 max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Error Loading Notifications</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button onClick={onClose} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-[300px] max-h-[80vh] shadow-2xl overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
              <button
                onClick={() => {
                  // Mark all as read
                  notifications.forEach(n => {
                    // Would call mark as read API
                  })
                }}
                className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 text-xs"
              >
                Mark All Read
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No notifications
            </p>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification: any, index: number) => (
                <div
                  key={notification.id || index}
                  className={`
                    border-l-4 ${notification.read ? 'border-gray-200' : 'border-blue-500'}
                    bg-${notification.read ? 'gray-50' : 'white'}
                    p-3 rounded
                    cursor-pointer hover:bg-gray-50 transition-colors
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{notification.title}</p>
                      <p className="text-xs text-gray-500 mb-1">{notification.message}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className={`text-xs ${notification.type === 'success' ? 'text-green-600' : notification.type === 'warning' ? 'text-yellow-600' : notification.type === 'error' ? 'text-red-600' : 'text-blue-600'}`}>
                        {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                      </span>
                      {!notification.read && (
                        <span className="text-xs bg-blue-500 text-white rounded-full px-2 py-0.5">
                          NEW
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex justify-between">
            <button
              onClick={() => {
                // Would mark all as read
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Mark All as Read
            </button>
            <span className="text-xs text-gray-500">
              {notifications.filter(n => !n.read).length} unread
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}