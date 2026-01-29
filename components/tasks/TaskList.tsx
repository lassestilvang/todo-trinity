import { TaskStatus, Priority } from '@/lib/types'
import { useState } from 'react'
import TaskItem from './TaskItem'

interface TaskListProps {
  tasks: Task[]
  onUpdate: (taskId: string, updates: Partial<Task>) => void
  onDelete: (taskId: string) => void
}

interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  dueDate?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
  userId: string
  listId?: string
  labels: Label[]
  list?: List
}

interface List {
  id: string
  name: string
  color: string
  icon: string
  createdAt: string
  updatedAt: string
  userId: string
  tasks: Task[]
}

interface Label {
  id: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
  userId: string
  tasks: Task[]
}

export default function TaskList({ tasks, onUpdate, onDelete }: TaskListProps) {
  const [filter, setFilter] = useState({
    status: TaskStatus.TODO as TaskStatus,
    priority: Priority.NORMAL as Priority,
  })

  const filteredTasks = tasks.filter(task => {
    return (
      task.status === filter.status &&
      task.priority === filter.priority
    )
  })

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    onUpdate(taskId, { status: newStatus })
  }

  const handlePriorityChange = (taskId: string, newPriority: Priority) => {
    onUpdate(taskId, { priority: newPriority })
  }

  const handleDelete = (taskId: string) => {
    onDelete(taskId)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-4">
          <select
            value={filter.status}
            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value as TaskStatus }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={TaskStatus.TODO}>TODO</option>
            <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
            <option value={TaskStatus.COMPLETED}>Completed</option>
          </select>

          <select
            value={filter.priority}
            onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value as Priority }))}
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
          />
        ))
      )}
    </div>
  )
}