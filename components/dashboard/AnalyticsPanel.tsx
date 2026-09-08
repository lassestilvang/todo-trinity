"use client"

import { useTaskContext } from '@/src/hooks/useTasks'
import { useTaskStats } from '@/src/hooks/useTasks'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'

const statusColors = {
  TODO: '#3B82F6',
  IN_PROGRESS: '#F59E0B',
  COMPLETED: '#10B981',
}

const priorityColors = {
  LOW: '#10B981',
  NORMAL: '#3B82F6',
  HIGH: '#F59E0B',
  URGENT: '#EF4444',
}

export default function AnalyticsPanel({ onClose }: { onClose: () => void }) {
  const { tasks, tasksLoading } = useTaskContext()
  const { stats, loading, error } = useTaskStats('demo') // Replace with actual user ID

  if (tasksLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const statusData = Object.entries(statusColors).map(([name, color]) => ({
    name,
    value: tasks.filter(t => t.status === name).length,
    color,
  }))

  const priorityData = Object.entries(priorityColors).map(([name, color]) => ({
    name,
    value: tasks.filter(t => t.priority === name).length,
    color,
  }))

  const tasksByListData = tasks.reduce((acc: any, task) => {
    const listName = task.list?.name || 'No List'
    if (!acc[listName]) {
      acc[listName] = { tasks: 0, color: task.list?.color || 'gray' }
    }
    acc[listName].tasks++
    return acc
  }, {})

  const listChartData = Object.entries(tasksByListData).map(([name, data]: [string, any]) => ({
    name,
    tasks: data.tasks,
    color: data.color,
  }))

  const completedThisWeek = tasks.filter(task => {
    if (!task.completedAt) return false
    const completed = new Date(task.completedAt)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return completed >= weekAgo
  }).length

  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate) return false
    return new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED'
  }).length

  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] shadow-2xl overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Analytics & Insights</h2>
          <button
            onClick={onClose}
            className="absolute right-4 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900">Total Tasks</h3>
              <p className="text-2xl font-bold text-blue-600">{tasks.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-900">Completed</h3>
              <p className="text-2xl font-bold text-green-600">{stats?.completedTasks || 0}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-yellow-900">In Progress</h3>
              <p className="text-2xl font-bold text-yellow-600">{inProgressTasks}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-900">Overdue</h3>
              <p className="text-2xl font-bold text-red-600">{overdueTasks}</p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Pie Chart */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Tasks by Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Priority Pie Chart */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Tasks by Priority</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Tasks by List Bar Chart */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Tasks by List</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={listChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Bar dataKey="tasks" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Week Trend Line Chart */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Weekly Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats?.trend?.slice(-7) || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Line type="monotone" dataKey="completed" stroke="#10B981" />
                  <Line type="monotone" dataKey="created" stroke="#3B82F6" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Insights Section */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Productivity Insights</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {stats?.insights?.map((insight: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>{insight}</span>
                </li>
              )) || (
                <li className="text-gray-500">No insights available. Complete more tasks to get insights.</li>
              )}
            </ul>
          </div>

          {/* Stats Footer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <strong>Completion Rate:</strong> {stats?.completionRate || 0}% {stats?.completionRate && stats.completionRate < 50 ? '(Low - Consider breaking down tasks)' : stats.completionRate > 80 ? '(Excellent)' : '(Good)'}
            </div>
            <div>
              <strong>Completed This Week:</strong> {completedThisWeek} tasks
            </div>
            <div>
              <strong>Overdue Tasks:</strong> {overdueTasks} tasks {overdueTasks > 0 ? '(Requires immediate attention)' : '(On track)'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}