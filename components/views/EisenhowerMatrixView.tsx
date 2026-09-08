"use client"

import { Task, TaskStatus, Priority } from '@/src/types/index'
import { motion } from 'framer-motion'
import { predictiveScheduler } from '@/lib/prediction/scheduling'
import { useState } from 'react'

const quadrants = [
  { id: 1, title: 'Do First', color: 'bg-red-500', subtitle: 'Urgent & Important' },
  { id: 2, title: 'Schedule', color: 'bg-green-500', subtitle: 'Not Urgent & Important' },
  { id: 3, title: 'Delegate', color: 'bg-blue-500', subtitle: 'Urgent & Not Important' },
  { id: 4, title: 'Eliminate', color: 'bg-gray-500', subtitle: 'Not Urgent & Not Important' },
]

interface EisenhowerMatrixViewProps {
  tasks: Task[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onTaskDelete: (taskId: string) => void
}

export default function EisenhowerMatrixView({ tasks, onTaskUpdate, onTaskDelete }: EisenhowerMatrixViewProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [matrix, setMatrix] = useState<Map<number, Task[]>>(new Map())

  // Calculate the Eisenhower Matrix
  const eisenhowerMatrix = predictiveScheduler.getEisenhowerMatrix(tasks)

  const statusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO: return 'bg-gray-100'
      case TaskStatus.IN_PROGRESS: return 'bg-yellow-100'
      case TaskStatus.COMPLETED: return 'bg-green-100'
    }
  }

  const priorityBorder = (priority: Priority) => {
    switch (priority) {
      case Priority.LOW: return 'border-green-500'
      case Priority.NORMAL: return 'border-blue-500'
      case Priority.HIGH: return 'border-yellow-500'
      case Priority.URGENT: return 'border-red-500'
    }
  }

  const handleStatusChange = (task: Task) => {
    const newStatus = task.status === TaskStatus.COMPLETED
      ? TaskStatus.TODO
      : task.status === TaskStatus.TODO
      ? TaskStatus.IN_PROGRESS
      : TaskStatus.TODO

    onTaskUpdate(task.id, { status: newStatus })
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Eisenhower Matrix</h2>
      <p className="text-gray-600 mb-4">
        Prioritize tasks based on urgency and importance. Drag tasks between quadrants to reprioritize.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {quadrants.map((quadrant) => (
          <motion.div
            key={quadrant.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-xl p-4 ${quadrant.color} text-white`}
          >
            <h3 className="text-xl font-bold mb-1">{quadrant.title}</h3>
            <p className="text-sm opacity-90 mb-3">{quadrant.subtitle}</p>
            <div className="space-y-2">
              {(eisenhowerMatrix.get(quadrant.id as number) || []).map((task) => (
                <motion.div
                  key={task.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white/20 backdrop-blur-sm rounded-lg p-3 cursor-pointer"
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{task.title}</span>
                    <div className={`w-2 h-2 rounded-full ${priorityBorder(task.priority as Priority)}`} />
                  </div>
                  {task.dueDate && (
                    <p className="text-xs opacity-80 mt-1">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </motion.div>
              ))}
              {(eisenhowerMatrix.get(quadrant.id as number) || []).length === 0 && (
                <p className="text-sm opacity-80 text-center py-4">No tasks in this quadrant</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold mb-4">{selectedTask.title}</h3>
            <p className="text-gray-600 mb-4">{selectedTask.description}</p>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">Priority:</span>
                <span className="ml-2 text-sm">{getPriorityText(selectedTask.priority)}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <button
                  onClick={() => handleStatusChange(selectedTask)}
                  className="ml-2 px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                >
                  {selectedTask.status} → {getNextStatus(selectedTask.status)}
                </button>
              </div>
              {selectedTask.dueDate && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Due:</span>
                  <span className="ml-2 text-sm">
                    {new Date(selectedTask.dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Close
              </button>
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
              >
                Apply
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function getPriorityText(priority: Priority): string {
  switch (priority) {
    case Priority.LOW: return 'Low'
    case Priority.NORMAL: return 'Normal'
    case Priority.HIGH: return 'High'
    case Priority.URGENT: return 'Urgent'
  }
}

function getNextStatus(current: TaskStatus): TaskStatus {
  switch (current) {
    case TaskStatus.TODO: return TaskStatus.IN_PROGRESS
    case TaskStatus.IN_PROGRESS: return TaskStatus.COMPLETED
    default: return TaskStatus.TODO
  }
}