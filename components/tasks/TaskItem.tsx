"use client"

import { TaskStatus, Priority, Task, List, Label, SubTask, TaskDependency } from '@/src/types/index'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import CommentThread from '@/components/comments/CommentThread'
import SubTaskItem from '@/components/tasks/SubTaskItem'
import { useSubTasks } from '@/src/hooks/useTasks'
import { useTaskDependencies } from '@/src/hooks/useTasks'

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

interface TaskItemProps {
  task: Task
  onStatusChange: (taskId: string, status: TaskStatus) => void
  onPriorityChange: (taskId: string, priority: Priority) => void
  onDelete: (taskId: string) => void
  onCommentsOpen: (taskId: string) => void
}

export default function TaskItem({ task, onStatusChange, onPriorityChange, onDelete, onCommentsOpen }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [showComments, setShowComments] = useState(false)
  const [showSubtasks, setShowSubtasks] = useState(false)

  const { subtasks, createSubTask, updateSubTask, deleteSubTask, isCreating } = useSubTasks(task.id)
  const { dependencies, createDependency, deleteDependency } = useTaskDependencies(task.id)

  const handleSubTaskCreate = () => {
    if (typeof window !== 'undefined' && window.confirm('Add a subtask?')) {
      createSubTask({ title: 'New subtask', taskId: task.id })
    }
  }

  const handleSubTaskUpdate = (subtaskId: string, updates: Partial<SubTask>) => {
    updateSubTask({ taskId: task.id, subTaskId: subtaskId, updates })
  }

  const handleSubTaskDelete = (subtaskId: string) => {
    deleteSubTask({ taskId: task.id, subTaskId: subtaskId })
  }

  const handleAddDependency = () => {
    if (typeof window !== 'undefined') {
      const dependsOnId = window.prompt('Enter the task ID this task depends on:')
      if (dependsOnId) {
        createDependency({ taskId: task.id, dependsOnId })
      }
    }
  }

  const handleRemoveDependency = (dependsOnId: string) => {
    deleteDependency({ taskId: task.id, dependsOnId })
  }

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
    if (typeof window !== 'undefined' && window.confirm('Are you sure you want to delete this task?')) {
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
              onClick={() => {
                setShowSubtasks(!showSubtasks)
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Toggle subtasks"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h6m-2 2v-4" />
              </svg>
            </button>

            <button
              onClick={() => {
                onCommentsOpen(task.id)
                setShowComments(true)
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11H6a2 2 0 00-2 2v4a2 2 0 002 2h2m6 0H16a2 2 0 012 2v2a2 2 0 01-2 2h-2m-8 0v-4c0-2.21 1.79-4 4-4h4c2.21 0 4 1.79 4 4v4z" />
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
            {task.labels.map((label: Label) => (
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

        {/* Subtasks Section */}
        {subtasks.length > 0 && showSubtasks && (
          <div className="mt-4 pl-2 border-l-2 border-gray-100">
            {subtasks.map(subtask => (
              <SubTaskItem
                key={subtask.id}
                subtask={subtask}
                onUpdate={handleSubTaskUpdate}
                onDelete={handleSubTaskDelete}
              />
            ))}
          </div>
        )}

        {/* Dependencies Section */}
        {dependencies.length > 0 && showSubtasks && (
          <div className="mt-4 pl-2 border-l-2 border-yellow-100">
            <p className="text-xs font-medium text-yellow-800 mb-2">Depends on:</p>
            {dependencies.map(dep => (
              <div key={dep.id} className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <span className="text-yellow-500">→</span>
                <span className="font-mono text-xs">{dep.dependsOnId}</span>
                <button
                  onClick={() => handleRemoveDependency(dep.dependsOnId)}
                  className="p-0.5 text-gray-400 hover:text-red-500"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              onClick={handleAddDependency}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700"
            >
              + Add dependency
            </button>
          </div>
        )}
      </div>

      {showComments && (
        <CommentThread
          taskId={task.id}
          onClose={() => setShowComments(false)}
        />
      )}
    </motion.div>
  )
}