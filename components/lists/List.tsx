import { useState } from 'react'
import Button from './button.tsx'
import Label from './Label.tsx'

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

interface Label {
  id: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
  userId: string
  tasks: Task[]
}

interface ListProps {
  list: List
  labels: Label[]
  onDelete: (listId: string) => void
  onLabelCreate: (labelData: Partial<Label>) => void
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
      setNewLabelName(''')
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={`
                ${icon === 'briefcase' ? 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2z' : ''}
                ${icon === 'home' ? 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' : ''}
                ${icon === 'shopping-cart' ? 'M3 3h2l.76 1.789M3 12h4M3 5h3M3 8h3M5 8v10h12v-10h3' : ''}
                ${icon === 'book' ? 'M12 6.253v13m0-13C11 5.477 7.896 4.586 5.027 5.247 2.215 5.861 1 8.43 1 11.244l.012.023c-.02.194-.033.39-.033.588v13a2 2 0 002 2h11a2 2 0 002-2v-13a2 2 0 00-2-2v-.012a2.966 2.966 0 00-.438-.626A9.955 9.955 0 0012 5.253z' : ''}
                ${icon === 'heart' ? 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' : ''}
                ${icon === 'star' ? 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L.613 13.44c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' : ''}
                ${icon === 'flag' ? 'M3 21v-4a2 2 0 012-2h4a2 2 0 012 2v4M8 7V3m0 4L4 7m8 4v12h4m0-12L12 3m8 4h-4' : ''}
                ${icon === 'clock' ? 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' : ''}
              </path>
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
            <Label
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