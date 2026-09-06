import { TaskStatus, Priority, Task, List, Label } from '@/src/types/index'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TaskItemProps {
  task: Task
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
  onPriorityChange: (taskId: string, newPriority: Priority) => void
  onDelete: (taskId: string) => void
}

const statusColors = {
  [TaskStatus.TODO]: 'bg-blue-100 text-blue-800 border-blue-300',
  [TaskStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  [TaskStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-300',
}

const priorityColors = {
  [Priority.LOW]: 'bg-green-100 text-green-800 border-green-300',
  [Priority.NORMAL]: 'bg-blue-100 text-blue-800 border-blue-300',
  [Priority.HIGH]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  [Priority.URGENT]: 'bg-red-100 text-red-800 border-red-300',
}

export default function TaskItem({ task, onStatusChange, onPriorityChange, onDelete }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')

  const handleSave = async () => {
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTitle(task.title)
    setDescription(task.description || '')
    setIsEditing(false)
  }

  const handleStatusToggle = () => {
    const newStatus = task.status === TaskStatus.COMPLETED
      ? TaskStatus.TODO
      : task.status === TaskStatus.TODO
      ? TaskStatus.IN_PROGRESS
      : TaskStatus.COMPLETED
    onStatusChange(task.id, newStatus)
  }

  const handlePriorityChange = (newPriority: Priority) => {
    onPriorityChange(task.id, newPriority)
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleStatusToggle}
            className={cn(
              'p-2 rounded-full transition-colors',
              task.status === TaskStatus.COMPLETED
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            )}
          >
            {task.status === TaskStatus.COMPLETED ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Task title"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Task description (optional)"
                  rows={2}
                />
              </div>
            ) : (
              <div className="flex flex-col">
                <h3 className="font-medium text-gray-900 truncate">
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {task.description}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={task.priority}
              onChange={(e) => handlePriorityChange(e.target.value as Priority)}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
            >
              <option value={Priority.LOW}>Low</option>
              <option value={Priority.NORMAL}>Normal</option>
              <option value={Priority.HIGH}>High</option>
              <option value={Priority.URGENT}>Urgent</option>
            </select>

            {task.dueDate && (
              <span className="text-sm text-gray-500">
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            <button
              onClick={handleDelete}
              className="p-1 text-red-500 hover:text-red-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {task.labels.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {task.labels.map(label => (
              <span
                key={label.id}
                className={cn(
                  'px-2 py-1 rounded-full text-xs',
                  label.color
                    ? `bg-${label.color}-100 text-${label.color}-800`
                    : 'bg-gray-100 text-gray-800'
                )}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}