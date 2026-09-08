"use client"

import { useTaskContext } from '@/src/hooks/useTasks'
import { TaskStatus, Priority } from '@/src/types/index'
import { useMemo } from 'react'

export default function GanttView() {
  const { tasks } = useTaskContext()

  const tasksWithDueDates = useMemo(() => {
    return tasks.filter(t => t.dueDate && t.status !== 'COMPLETED')
      .sort((a, b) => {
        const aDate = new Date(a.dueDate!)
        const bDate = new Date(b.dueDate!)
        return aDate.getTime() - bDate.getTime()
      })
  }, [tasks])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = new Date()
  endDate.setDate(today.getDate() + 14)

  const priorityColor = (priority: string) => {
    switch (priority) {
      case Priority.LOW: return 'bg-green-500'
      case Priority.NORMAL: return 'bg-blue-500'
      case Priority.HIGH: return 'bg-yellow-500'
      case Priority.URGENT: return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getDateRange = () => {
    const dates: Date[] = []
    const current = new Date(today)
    while (current <= endDate) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return dates
  }

  const dates = getDateRange()

  return (
    <div className="bg-white rounded-lg shadow-md p-6 overflow-x-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Project Timeline (Gantt View)
      </h2>

      {tasksWithDueDates.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming tasks</h3>
          <p className="text-gray-600">
            Add tasks with due dates to see them in the timeline view.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Timeline header */}
          <div className="flex items-center border-b border-gray-200">
            <div className="w-64 font-medium text-gray-700">Task</div>
            <div className="flex-1 grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
              {dates.map((date, index) => {
                const isWeekend = date.getDay() === 0 || date.getDay() === 6
                return (
                  <div
                    key={index}
                    className={`
                      p-1 border-l border-gray-100
                      ${isWeekend ? 'bg-gray-50 text-gray-400' : ''}
                      ${date.toDateString() === today.toDateString() ? 'bg-blue-50 font-medium text-blue-600' : ''}
                    `}
                  >
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    <br />
                    {date.getDate()}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tasks */}
          {tasksWithDueDates.map((task) => {
            const dueDate = new Date(task.dueDate!)
            dueDate.setHours(0, 0, 0, 0)
            const startDate = task.createdAt ? new Date(task.createdAt) : new Date(dueDate)
            startDate.setDate(startDate.getDate() - 3)

            const daysFromStart = Math.floor(
              (startDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
            )
            const daysFromEnd = Math.floor(
              (dueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
            )

            const startCol = Math.max(0, daysFromStart)
            const endCol = Math.min(6, Math.max(0, daysFromEnd))

            const isOverdue = dueDate < today && task.status !== 'COMPLETED'

            return (
              <div key={task.id} className="flex items-center border-b border-gray-100">
                <div className="w-64 flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${priorityColor(task.priority)}`} />
                  <span className={`
                    ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-800'}
                    truncate max-w-[200px]
                  `}>
                    {task.title}
                  </span>
                </div>
                <div className="flex-1 grid grid-cols-7 gap-1">
                  <div
                    className={`
                      relative h-8 rounded
                      ${isOverdue ? 'bg-red-100' : 'bg-gray-100'}
                    `}
                    style={{
                      gridColumnStart: startCol + 1,
                      gridColumnEnd: `span ${Math.max(1, endCol - startCol + 1)}`,
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-600">
                      Due {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}