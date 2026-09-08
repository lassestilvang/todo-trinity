"use client"

import { useTaskContext } from '@/src/hooks/useTasks'
import { TaskStatus, Priority } from '@/src/types/index'

interface KanbanColumn {
  status: TaskStatus
  title: string
  tasks: any[]
  color: string
}

export default function KanbanBoard() {
  const { tasks } = useTaskContext()

  const columns: KanbanColumn[] = [
    {
      status: TaskStatus.TODO,
      title: 'TODO',
      tasks: tasks.filter(t => t.status === TaskStatus.TODO),
      color: 'blue',
    },
    {
      status: TaskStatus.IN_PROGRESS,
      title: 'In Progress',
      tasks: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS),
      color: 'yellow',
    },
    {
      status: TaskStatus.COMPLETED,
      title: 'Completed',
      tasks: tasks.filter(t => t.status === TaskStatus.COMPLETED),
      color: 'green',
    },
  ]

  const priorityColors: Record<Priority, string> = {
    [Priority.LOW]: 'bg-green-500',
    [Priority.NORMAL]: 'bg-blue-500',
    [Priority.HIGH]: 'bg-yellow-500',
    [Priority.URGENT]: 'bg-red-500',
  }

  const statusColors = {
    [TaskStatus.TODO]: 'bg-blue-100 text-blue-800 border-blue-300',
    [TaskStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    [TaskStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-300',
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 overflow-y-auto max-h-[700px]">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Kanban Board
      </h2>

      {columns.map((column) => (
        <div key={column.status} className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className={`flex items-center justify-between mb-3 ${statusColors[column.status] || ''}`}>
            <h3 className="font-medium text-gray-800">
              {column.title} {column.tasks.length}
            </h3>
            <button
              className="px-2 py-1 text-xs rounded bg-gray-200 text-gray-700"
            >
              +Add
            </button>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {column.tasks.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">
                No tasks in this column
              </p>
            ) : (
              column.tasks.map((task) => (
                <div
                  key={task.id}
                  className={`
                    bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer
                  `}
                  onClick={() => {
                    // Would navigate to task detail
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 line-clamp-1">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500">
                        {task.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}