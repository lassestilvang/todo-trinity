import { useState } from 'react'
import Button from '../ui/button'
import LabelComponent from '../labels/Label'
import { List as ListType, Task, Label as LabelType } from '@/src/types/index'

interface ListProps {
  list: ListType
  labels: LabelType[]
  onDelete: (listId: string) => void
  onLabelCreate: (labelData: Partial<LabelType>) => void
}

export default function List({ list, labels, onDelete, onLabelCreate }: ListProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(list.name)
  const [color, setColor] = useState(list.color)
  const [icon, setIcon] = useState(list.icon)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('blue')

  const icons = [
    { value: 'briefcase', label: 'Work' },
    { value: 'home', label: 'Home' },
    { value: 'shopping-cart', label: 'Shopping' },
    { value: 'book', label: 'Learning' },
    { value: 'heart', label: 'Personal' },
    { value: 'star', label: 'Important' },
    { value: 'flag', label: 'Flag' },
    { value: 'clock', label: 'Time' },
  ]

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

  const handleSave = () => {
    // In a real application, you would save the changes to the database
    setIsEditing(false)
  }

  const handleCancel = () => {
    setName(list.name)
    setColor(list.color)
    setIcon(list.icon)
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this list?')) {
      onDelete(list.id)
    }
  }

  const handleCreateLabel = () => {
    if (newLabelName.trim()) {
      onLabelCreate({
        name: newLabelName.trim(),
        color: newLabelColor,
        userId: list.userId,
      })
      setNewLabelName('')
      setNewLabelColor('blue')
    }
  }

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <select
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {icons.map(i => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="List name"
            />
          </div>
          <div className="flex items-center space-x-2">
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
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            color ? `bg-${color}-100 text-${color}-600` : 'bg-gray-100 text-gray-600'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2z" />
            </svg>
          </span>
          <h3 className="font-medium text-gray-900">
            {name}
          </h3>
          <div className="text-sm text-gray-600">
            {list.tasks.length} tasks
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            Edit
          </Button>
          <Button onClick={handleDelete} variant="destructive" size="sm">
            Delete
          </Button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">
            Labels
          </h4>
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            Add Label
          </Button>
        </div>

        {isEditing && (
          <div className="space-y-2 mb-4">
            <input
              type="text"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              placeholder="Label name"
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newLabelColor}
              onChange={(e) => setNewLabelColor(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {colors.map(c => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <Button onClick={handleCreateLabel} variant="outline" size="sm">
              Create Label
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {labels.map(label => (
            <LabelComponent
              key={label.id}
              label={label}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </div>
  )
}