"use client"

import { useState } from 'react'
import { Check, X, Pencil, Trash2, GripVertical } from 'lucide-react'
import { SubTask } from '@/src/types/index'

interface SubTaskItemProps {
  subtask: SubTask
  onUpdate: (id: string, updates: Partial<SubTask>) => void
  onDelete: (id: string) => void
}

export default function SubTaskItem({ subtask, onUpdate, onDelete }: SubTaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(subtask.title)

  const handleSave = () => {
    if (editTitle.trim()) {
      onUpdate(subtask.id, { title: editTitle.trim() })
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditTitle(subtask.title)
    setIsEditing(false)
  }

  const handleToggle = () => {
    onUpdate(subtask.id, {
      completed: !subtask.completed,
      completedAt: !subtask.completed ? new Date().toISOString() : null
    })
  }

  return (
    <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 transition-colors group">
      <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />

      <button
        onClick={handleToggle}
        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          subtask.completed
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 hover:border-blue-500'
        }`}
      >
        {subtask.completed && <Check className="w-3 h-3 text-white" />}
      </button>

      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') handleCancel()
            }}
            autoFocus
            className="flex-1 px-2 py-1 border border-blue-500 rounded outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button
            onClick={handleSave}
            className="p-1 text-green-600 hover:text-green-700"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-between">
          <span
            className={`text-sm ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}
          >
            {subtask.title}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-400 hover:text-blue-600"
              title="Edit subtask"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDelete(subtask.id)}
              className="p-1 text-gray-400 hover:text-red-600"
              title="Delete subtask"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}