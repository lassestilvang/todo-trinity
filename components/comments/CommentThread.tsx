"use client"

import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'
import { useToast } from '@/src/hooks/useToast'

interface Comment {
  id: string
  content: string
  taskId: string
  userId: string
  createdAt: string
  updatedAt: string
  parentId: string | null
  resolved: boolean
  user: {
    id: string
    name: string
    image?: string
  }
  replies: Comment[]
  mentions: any[]
}

export default function CommentThread({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { addToast } = useToast()

  useEffect(() => {
    fetchComments()
  }, [taskId])

  const fetchComments = async () => {
    setLoading(true)
    try {
      const data = await api.getComments(taskId)
      setComments(data.comments || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load comments')
      addToast(err.message || 'Failed to load comments', 'error')
    } finally {
      setLoading(false)
    }
  }

  const submitComment = async () => {
    if (!newComment.trim()) return

    try {
      await api.createComment({ taskId, content: newComment })
      addToast('Comment added', 'success')
      setNewComment('')
      fetchComments()
    } catch (err: any) {
      addToast(err.message || 'Failed to add comment', 'error')
    }
  }

  const resolveComment = async (commentId: string) => {
    try {
      await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: true }),
      })
      addToast('Comment resolved', 'success')
      fetchComments()
    } catch (err: any) {
      addToast(err.message || 'Failed to resolve comment', 'error')
    }
  }

  const deleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment? This action cannot be undone.')) return

    try {
      await api.deleteComment(commentId)
      addToast('Comment deleted', 'success')
      fetchComments()
    } catch (err: any) {
      addToast(err.message || 'Failed to delete comment', 'error')
    }
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={`
        border-l-2 pl-4 mb-4
        ${isReply ? 'ml-4 border-gray-200' : 'ml-0 border-blue-200'}
      `}
    >
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center">
          {comment.user?.image ? (
            <img src={comment.user.image} alt={comment.user.name} className="w-full h-full rounded-full" />
          ) : (
            <span className="text-sm font-medium text-gray-600">
              {comment.user?.name?.charAt(0) || '?'}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900">{comment.user?.name || 'Anonymous'}</div>
          <p className="text-sm text-gray-600 mt-1">{comment.content}</p>
          <div className="flex items-center space-x-2 mt-2 text-xs text-gray-400">
            <span>{new Date(comment.createdAt).toLocaleString()}</span>
            {comment.resolved && (
              <span className="text-green-500">✓ Resolved</span>
            )}
          </div>
          <div className="flex items-center space-x-2 mt-2">
            {!comment.resolved && (
              <button
                onClick={() => resolveComment(comment.id)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Mark as resolved
              </button>
            )}
            <button
              onClick={() => deleteComment(comment.id)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 ml-4 border-l-2 border-gray-100 pl-4">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end p-4">
      <div className="bg-white rounded-t-2xl w-full max-w-2xl max-h-[80vh] shadow-2xl flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">Loading comments...</div>
          ) : error ? (
            <p className="text-red-500 text-center py-4">{error}</p>
          ) : comments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => renderComment(comment))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Type a comment... (use @ to mention users)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <button
              onClick={submitComment}
              disabled={!newComment.trim()}
              className={`
                px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600
                ${!newComment.trim() ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}