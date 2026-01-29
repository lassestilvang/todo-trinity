import { TaskStatus, Priority } from '@/lib/types'
import { useState } from 'react'

interface SidebarProps {
  selectedList: string
  selectedStatus: TaskStatus
  selectedPriority: Priority
  onListChange: (listId: string) => void
  onStatusChange: (status: TaskStatus) => void
  onPriorityChange: (priority: Priority) => void
}

export default function Sidebar({
  selectedList,
  selectedStatus,
  selectedPriority,
  onListChange,
  onStatusChange,
  onPriorityChange,
}: SidebarProps) {
  const [lists] = useState([
    { id: '', name: 'All Tasks', color: 'gray' },
    { id: 'work', name: 'Work', color: 'blue' },
    { id: 'personal', name: 'Personal', color: 'green' },
    { id: 'shopping', name: 'Shopping', color: 'purple' },
    { id: 'learning', name: 'Learning', color: 'orange' },
  ])

  const [statuses] = useState([
    { value: TaskStatus.TODO, label: 'TODO', color: 'blue' },
    { value: TaskStatus.IN_PROGRESS, label: 'In Progress', color: 'yellow' },
    { value: TaskStatus.COMPLETED, label: 'Completed', color: 'green' },
  ])

  const [priorities] = useState([
    { value: Priority.LOW, label: 'Low', color: 'green' },
    { value: Priority.NORMAL, label: 'Normal', color: 'blue' },
    { value: Priority.HIGH, label: 'High', color: 'yellow' },
    { value: Priority.URGENT, label: 'Urgent', color: 'red' },
  ])

  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Filters
        </h2>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Lists
          </h3>
          <ul className="space-y-1">
            {lists.map(list => (
              <li key={list.id}>
                <button
                  onClick={() => onListChange(list.id)}
                  className={`w-full flex items-center justify-start px-3 py-2 text-left rounded-md transition-colors ${
                    selectedList === list.id
                      ? `bg-${list.color}-100 text-${list.color}-600`
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full mr-3 ${
                      selectedList === list.id
                        ? `bg-${list.color}-600`
                        : 'bg-gray-400'
                    }`}
                  />
                  {list.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Status
          </h3>
          <ul className="space-y-1">
            {statuses.map(statusItem => (
              <li key={statusItem.value}>
                <button
                  onClick={() => onStatusChange(statusItem.value)}
                  className={`w-full flex items-center justify-start px-3 py-2 text-left rounded-md transition-colors ${
                    selectedStatus === statusItem.value
                      ? `bg-${statusItem.color}-100 text-${statusItem.color}-600`
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full mr-3 ${
                      selectedStatus === statusItem.value
                        ? `bg-${statusItem.color}-600`
                        : 'bg-gray-400'
                    }`}
                  />
                  {statusItem.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Priority
          </h3>
          <ul className="space-y-1">
            {priorities.map(priorityItem => (
              <li key={priorityItem.value}>
                <button
                  onClick={() => onPriorityChange(priorityItem.value)}
                  className={`w-full flex items-center justify-start px-3 py-2 text-left rounded-md transition-colors ${
                    selectedPriority === priorityItem.value
                      ? `bg-${priorityItem.color}-100 text-${priorityItem.color}-600`
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full mr-3 ${
                      selectedPriority === priorityItem.value
                        ? `bg-${priorityItem.color}-600`
                        : 'bg-gray-400'
                    }`}
                  />
                  {priorityItem.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}