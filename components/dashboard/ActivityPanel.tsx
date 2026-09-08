"use client"

import { useTaskContext } from '@/src/hooks/useTasks'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from '@/src/hooks/useToast'
import { useEffect, useState } from 'react'

interface ActivityLog {
  id: string
  action: string
  resource: string
  resourceId: string
  details: any
  createdAt: string
  userId: string
  user: { id: string; name: string; image?: string }
}

export default function ActivityPanel({ onClose }: { onClose: () => void }) {
  const { data: activityLogs, isLoading, error, refetch } = useQuery(
    ['activity-logs'],
    () => api.getAnalytics('', { limit: 50 }),
    {
      select: (data: any) => data.activity || [],
      staleTime: 1000 * 60 * 5,
    }
  )

  const [filter, setFilter] = useState({ action: '', resource: '' })

  const applyFilter = (filter: { action: string; resource: string }) => {
    setFilter(filter)
  }

  if (data.loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const formattedLogs: ActivityLog[] = activityLogs.map((log: any) => ({
    id: log.id || 'unknown',
    action: log.action || 'unknown',
    resource: log.resource || 'unknown',
    resourceId: log.resourceId || 'unknown',
    details: log.details || {},
    createdAt: new Date(log.createdAt).toLocaleString(),
    userId: log.userId || 'unknown',
    user: log.user || { id: '', name: 'Unknown' }
  }))

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] shadow-2xl overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Activity Log
          </h2>
          <button
            onClick={onClose}
            className="absolute right-4 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
          {/* Filter controls */}
          <div className="flex gap-3">
            <select
              value={filter.action}
              onChange={(e) => applyFilter({ action: e.target.value, resource: filter.resource })}
              className="px-3 py-1 border rounded"
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="complete">Complete</option>
              <option value="delete">Delete</option>
            </select>

            <select
              value={filter.resource}
              onChange={(e) => applyFilter({ action: filter.action, resource: e.target.value })}
              className="px-3 py-1 border rounded"
            >
              <option value="">All Resources</option>
              <option value="task">Task</option>
              <option value="list">List</option>
              <option value="label">Label</option>
            </select>
          </div>

          {/* Activity list */}
          {error && (
            <p className="text-red-500 text-sm">Error: {error.message}</p>
          )}

          {formattedLogs.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No activity logs found
            </p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {formattedLogs.map((log: ActivityLog) => (
                <div
                  key={log.id}
                  className={`
                    bg-white rounded-lg p-4 border-b border-gray-200
                    ${log.action === 'complete' || log.action === 'update' ? 'bg-gray-50' : ''}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {log.action}
                      </p>
                      <p className="text-xs text-gray-500">
                        {log.resource}: {log.resourceId || 'unknown'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {log.createdAt}
                      </p>
                    </div>
                    {log.details?.userId && (
                      <span
                        className="text-xs text-gray-400"
                      >
                        by {log.user?.name || 'unknown'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}