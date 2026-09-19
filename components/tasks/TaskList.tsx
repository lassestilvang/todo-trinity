import { TaskStatus, Priority, Task, List, Label } from '@/src/types/index'
import { useState, useMemo } from 'react'
import TaskItem from './TaskItem'

interface TaskListProps {
  tasks: Task[]
  onUpdate: (taskId: string, updates: Partial<Task>) => void
  onDelete: (taskId: string) => void
  onCommentsOpen?: (taskId: string) => void
  filter?: {
    status?: TaskStatus
    priority?: Priority
  }
  sortBy?: 'priority' | 'createdAt'
  selectedTasks?: string[]
  onSelectTask?: (taskId: string) => void
  dragEnabled?: boolean
}

export default function TaskList({
  tasks,
  onUpdate,
  onDelete,
  onCommentsOpen,
  filter,
  sortBy,
  selectedTasks = [],
  onSelectTask,
  dragEnabled = false
}: TaskListProps) {
  const [internalFilter, setInternalFilter] = useState({
    status: TaskStatus.TODO as TaskStatus,
    priority: Priority.NORMAL as Priority,
  })

  // Use external filter if provided, otherwise use internal state
  const activeFilter = filter || internalFilter
  const setFilter = filter ? (() => {}) : setInternalFilter

  const filteredTasks = useMemo(() => {
    let result = tasks.filter(task => {
      if (filter?.status && task.status !== filter.status) return false
      if (filter?.priority && task.priority !== filter.priority) return false
      return true
    })

    // Apply sorting
    if (sortBy === 'priority') {
      const priorityOrder = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 }
      result = [...result].sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0))
    } else if (sortBy === 'createdAt') {
      result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return result
  }, [tasks, filter, sortBy])

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    onUpdate(taskId, { status: newStatus })
  }

  const handlePriorityChange = (taskId: string, newPriority: Priority) => {
    onUpdate(taskId, { priority: newPriority })
  }

  const handleDelete = (taskId: string) => {
    onDelete(taskId)
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>, field: 'status' | 'priority') => {
    if (!filter) {
      setInternalFilter(prev => ({ ...prev, [field]: e.target.value as any }))
    }
  }

  return (
    <div className="space-y-4">
      {!filter && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-4">
            <select
              value={internalFilter.status}
              onChange={(e) => handleFilterChange(e, 'status')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={TaskStatus.TODO}>TODO</option>
              <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
              <option value={TaskStatus.COMPLETED}>Completed</option>
            </select>

            <select
              value={internalFilter.priority}
              onChange={(e) => handleFilterChange(e, 'priority')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={Priority.LOW}>Low</option>
              <option value={Priority.NORMAL}>Normal</option>
              <option value={Priority.HIGH}>High</option>
              <option value={Priority.URGENT}>Urgent</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            {filteredTasks.length} tasks
          </div>
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">
            <svg className="inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tasks found
          </h3>
          <p className="text-gray-600">
            Try changing the filters or create a new task.
          </p>
        </div>
      ) : (
        filteredTasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
            onDelete={handleDelete}
            onCommentsOpen={onCommentsOpen || (() => {})}
          />
        ))
      )}
    </div>
  )
}