"use client"

import { useState } from 'react'
import { useTaskContext } from '@/src/hooks/useTasks'
import { TaskStatus } from '@/src/types/index'

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function CalendarView() {
  const { tasks } = useTaskContext()
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const getTasksForDay = (day: number) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false
      const date = new Date(task.dueDate)
      return date.getDate() === day &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
    })
  }

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO: return 'bg-blue-500'
      case TaskStatus.IN_PROGRESS: return 'bg-yellow-500'
      case TaskStatus.COMPLETED: return 'bg-green-500'
    }
  }

  const daysInMonth = getDaysInMonth(currentMonth, currentYear)
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
  const today = new Date()

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              if (currentMonth === 0) {
                setCurrentMonth(11)
                setCurrentYear(currentYear - 1)
              } else {
                setCurrentMonth(currentMonth - 1)
              }
            }}
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            onClick={() => {
              setCurrentMonth(new Date().getMonth())
              setCurrentYear(new Date().getFullYear())
            }}
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >
            Today
          </button>
          <button
            onClick={() => {
              if (currentMonth === 11) {
                setCurrentMonth(0)
                setCurrentYear(currentYear + 1)
              } else {
                setCurrentMonth(currentMonth + 1)
              }
            }}
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <div key={index} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }).map((_, index) => (
          <div key={index} className="min-h-[100px] bg-gray-50 rounded" />
        ))}

        {/* Days of the month */}
        {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
          const day = dayIndex + 1
          const dayTasks = getTasksForDay(day)
          const isToday = today.getDate() === day &&
            today.getMonth() === currentMonth &&
            today.getFullYear() === currentYear

          return (
            <div
              key={day}
              className={`min-h-[100px] border rounded p-1 ${
                isToday ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
              }`}
            >
              <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                {day}
              </div>
              <div className="mt-1 space-y-1 max-h-[80px] overflow-y-auto">
                {dayTasks.map(task => (
                  <div
                    key={task.id}
                    className={`
                      text-xs px-1 py-0.5 rounded truncate cursor-pointer
                      ${getStatusColor(task.status)}
                    `}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-gray-400 text-center">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}