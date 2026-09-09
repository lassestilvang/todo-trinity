"use client"

import { useTaskContext } from '@/src/hooks/useTasks'
import { useToast } from '@/src/hooks/useToast'
import { Bell, Check, X, MessageSquare, ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Mention } from '@/src/types/index'

export default function MentionsPanel({ onClose }: { onClose: () => void }) {
  const { markMentionsAsRead, notifications } = useTaskContext()
  const { addToast } = useToast()

  const [mentions, setMentions] = useState<Mention[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMentions()
  }, [])

  const fetchMentions = async () => {
    setLoading(true)
    try {
      // Fetch from the mentions API via TaskContext's API
      const response = await fetch('/api/mentions')
      if (!response.ok) throw new Error('Failed to fetch mentions')
      const data = await response.json()
      setMentions(data.mentions || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load mentions')
      addToast(err.message || 'Failed to load mentions', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async () => {
    try {
      await fetch('/api/mentions', {
        method: 'PUT',
      })
      setMentions([])
      addToast('All mentions marked as read', 'success')
    } catch (err: any) {
      addToast(err.message || 'Failed to mark mentions as read', 'error')
    }
  }

  const handleOpenComment = (comment: Mention['comment']) => {
    // This would open the comment thread for the task
    // For now, we'll just close the panel
    onClose()
    // Could navigate to task or open comment modal
  }

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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Error Loading Mentions</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={onClose} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end p-4">
      <div className="bg-white rounded-t-2xl w-full max-w-2xl max-h-[80vh] shadow-2xl flex flex-col animate-slide-up">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Mentions</h2>
            {mentions.filter(m => !m.read).length > 0 && (
              <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                {mentions.filter(m => !m.read).length}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {mentions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No mentions yet</p>
              <p className="text-gray-400 text-sm">When someone mentions you in a comment, it will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mentions.map((mention, index) => (
                <div
                  key={mention.id || index}
                  className={`
                    border-l-4 p-4 rounded-r-lg transition-colors
                    ${mention.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-500'}
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center">
                      {mention.comment.user?.image ? (
                        <img src={mention.comment.user.image} alt={mention.comment.user.name} className="w-full h-full rounded-full" />
                      ) : (
                        <span className="text-sm font-medium text-gray-600">
                          {mention.comment.user?.name?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900">{mention.comment.user?.name || 'Someone'}</span>
                        <span className="text-xs text-gray-500">mentioned you in a comment</span>
                        {!mention.read && (
                          <span className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">NEW</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{mention.comment.content}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span>{new Date(mention.createdAt).toLocaleString()}</span>
                        <button
                          onClick={() => handleOpenComment(mention.comment)}
                          className="text-blue-500 hover:text-blue-700 flex items-center space-x-1"
                        >
                          <ArrowRight className="w-3 h-3" />
                          <span>View comment</span>
                        </button>
                      </div>
                    </div>
                    {!mention.read && (
                      <button
                        onClick={async () => {
                          // Mark single as read
                          // For now, we just refresh
                          fetchMentions()
                        }}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                        title="Mark as read"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {mentions.length > 0 && (
          <div className="p-4 border-t border-gray-200 flex justify-between items-center">
            <button
              onClick={handleMarkAsRead}
              className="px-4 py-2 text-sm text-red-500 hover:text-red-700 font-medium"
            >
              Mark All as Read
            </button>
            <span className="text-xs text-gray-500">
              {mentions.filter(m => !m.read).length} unread
            </span>
          </div>
        )}
      </div>
    </div>
  )
}