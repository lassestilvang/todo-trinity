import { TaskStatus, Priority } from '@/lib/types'
import { useState } from 'react'

interface AddTaskProps {
  onCreate: (taskData: Partial<Task>) => void
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

export default function AddTask({ onCreate }: AddTaskProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState(TaskStatus.TODO)
  const [priority, setPriority] = useState(Priority.NORMAL)
  const [dueDate, setDueDate] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      return
    }

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      dueDate: dueDate || undefined,
    }

    onCreate(taskData)
    resetForm()
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setStatus(TaskStatus.TODO)
    setPriority(Priority.NORMAL)
    setDueDate('')
    setIsExpanded(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            {isExpanded ? 'Create New Task' : 'Quick Add'}
          </h3>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            {isExpanded ? 'Less <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>' : 'More <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>'}
          </button>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        {isExpanded && (
          <div className="space-y-4">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description (optional)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="grid grid-cols-2 gap-4">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={TaskStatus.TODO}>TODO</option>
                <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                <option value={TaskStatus.COMPLETED}>Completed</option>
              </select>

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={Priority.LOW}>Low</option>
                <option value={Priority.NORMAL}>Normal</option>
                <option value={Priority.HIGH}>High</option>
                <option value={Priority.URGENT}>Urgent</option>
              </select>
            </div>

            <div className="flex items-center">
              <label htmlFor="due-date" className="text-sm text-gray-700 mr-2">
                Due Date:
              </label>
              <input
                type="date"
                id="due-date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <button
            type="submit"
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
            {isExpanded ? 'Create Task' : 'Add'}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}