import { useState } from 'react'
import Button from '../ui/button.tsx'
import { Task, Label, List } from '@/src/types/index'

interface LabelProps {
  label: Label
  onDelete: (labelId: string) => void
}

export default function Label({ label, onDelete }: LabelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(label.name)
  const [color, setColor] = useState(label.color)

  const handleSave = () => {
    // In a real application, you would save the changes to the database
    setIsEditing(false)
  }

  const handleCancel = () => {
    setName(label.name)
    setColor(label.color)
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this label?')) {
      onDelete(label.id)
    }
  }

  const colors = [
    { value: 'gray', label: 'Gray' },
    { value: 'red', label: 'Red' },
    { value: 'orange', label: 'Orange' },
    { value: 'yellow', label: 'Yellow' },
    { value: 'green', label: 'Green' },
    { value: 'teal', label: 'Teal' },
    { value: 'blue', label: 'Blue' },
    { value: 'indigo', label: 'Indigo' },
    { value: 'purple', label: 'Purple' },
    { value: 'pink', label: 'Pink' },
  ]

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2 mb-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Label name"
        />
        <select
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {colors.map(c => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <Button onClick={handleSave} variant="outline" size="sm">
          Save
        </Button>
        <Button onClick={handleCancel} variant="ghost" size="sm">
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 mb-2">
      <span
        className={`px-2 py-1 rounded-full text-xs ${
          color ? `bg-${color}-100 text-${color}-800` : 'bg-gray-100 text-gray-800'
        }`}
      >
        {label.name}
      </span>
      <Button onClick={() => setIsEditing(true)} variant="ghost" size="sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </Button>
      <Button onClick={handleDelete} variant="destructive" size="sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </Button>
    </div>
  )
}