"use client"

import { useState, useEffect } from 'react'
import { TaskStatus, Priority } from '@/src/types/index'
import { useTaskContext } from '@/src/contexts'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts'
import { TrendingUp, Calendar, Users, Target, Clock, Star, Activity, Award, Zap, PieChart as PieChartIcon, RefreshCw, Filter, LayoutList, LayoutDashboard } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function AnalyticsPanel({ onClose }: { onClose?: () => void }) {
  const { tasks, lists, labels, getAnalytics, getUserStats } = useTaskContext()
  const [analytics, setAnalytics] = useState<any>(null)
  const [userStats, setUserStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [timeframe, setTimeframe] = useState('week')

  const handleGenerateAnalytics = async () => {
    setIsLoading(true)
    try {
      const userId = 'user123'
      const analyticsData = await getAnalytics(userId, { timeframe })
      const statsData = await getUserStats(userId)
      setAnalytics(analyticsData)
      setUserStats(statsData)
    } catch (error) {
      console.error('Failed to generate analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    handleGenerateAnalytics()
  }, [timeframe, handleGenerateAnalytics])

  const calculateStats = () => {
    const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length
    const todo = tasks.filter(t => t.status === TaskStatus.TODO).length
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length

    const priorityCounts = {
      urgent: tasks.filter(t => t.priority === Priority.URGENT).length,
      high: tasks.filter(t => t.priority === Priority.HIGH).length,
      normal: tasks.filter(t => t.priority === Priority.NORMAL).length,
      low: tasks.filter(t => t.priority === Priority.LOW).length,
    }

    const listCounts = lists.map(list => ({
      name: list.name,
      value: tasks.filter(t => t.listId === list.id).length,
      color: list.color || '#3b82f6'
    }))

    const weeklyData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' })
      const dayTasks = tasks.filter(t => {
        if (!t.dueDate) return false
        const taskDate = new Date(t.dueDate)
        return taskDate.toDateString() === date.toDateString()
      })
      weeklyData.push({
        day: dayStr,
        tasks: dayTasks.length,
        completed: dayTasks.filter(t => t.status === TaskStatus.COMPLETED).length,
        started: dayTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length
      })
    }

    // Calculate velocity (tasks completed per week over last 4 weeks)
    const completedThisWeek = tasks.filter(t =>
      t.status === TaskStatus.COMPLETED &&
      t.completedAt &&
      new Date(t.completedAt).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0) - 7 * 24 * 60 * 60 * 1000
    ).length

    const completedLastWeek = tasks.filter(t =>
      t.status === TaskStatus.COMPLETED &&
      t.completedAt &&
      new Date(t.completedAt).getTime() < new Date().setHours(0, 0, 0, 0) - 7 * 24 * 60 * 60 * 1000 &&
      new Date(t.completedAt).getTime() >= new Date().setHours(0, 0, 0, 0) - 14 * 24 * 60 * 60 * 1000
    ).length

    const velocity = completedLastWeek > 0
      ? Math.round((completedThisWeek / completedLastWeek) * 10) / 10  // 1 decimal place
      : 1.0

    const avgTaskDuration = tasks.length > 0
      ? Math.round((tasks.reduce((sum, t) => {
          if (t.createdAt && t.completedAt) {
            const duration = new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime()
            return sum + duration / (1000 * 60 * 60) // hours
          }
          return sum
        }, 0) / tasks.length) * 10) / 10
      : 0

    // Priority trend analysis
    const priorityTrend = {
      urgentChange: calculatePriorityTrend(Priority.URGENT),
      highChange: calculatePriorityTrend(Priority.HIGH),
      normalChange: calculatePriorityTrend(Priority.NORMAL),
      lowChange: calculatePriorityTrend(Priority.LOW)
    }

    return {
      completed,
      inProgress,
      todo,
      overdue,
      priorityCounts,
      listCounts,
      weeklyData,
      productivity: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
      velocity,
      avgTaskDuration,
      priorityTrend
    }
  }

  function calculatePriorityTrend(priority: Priority): number {
    const priorityTasks = tasks.filter(t => t.priority === priority)
    if (priorityTasks.length === 0) return 0

    const now = new Date()
    const recentCompleted = priorityTasks.filter(t =>
      t.completedAt &&
      new Date(t.completedAt) >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // last 30 days
    ).length

    const previousPeriodCompleted = priorityTasks.filter(t =>
      t.completedAt &&
      new Date(t.completedAt) < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) &&
      new Date(t.completedAt) >= new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) // 30-60 days ago
    ).length

    if (previousPeriodCompleted === 0) {
      return recentCompleted > 0 ? 1.0 : 0.0
    }

    return Math.round((recentCompleted / previousPeriodCompleted) * 100) / 100
  }

  const stats = calculateStats()

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="day">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Tasks</h3>
            <Target className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{tasks.length}</p>
          <div className="mt-2 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>Productivity: {stats.productivity}%</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Completed</h3>
            <Star className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <span>({Math.round((stats.completed / (tasks.length || 1)) * 100)}%)</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">In Progress</h3>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            <span>Average time: 2.5 days</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Overdue</h3>
            <Zap className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
          <div className="mt-2 flex items-center text-sm text-red-600">
            <span>Requires attention</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={Object.entries(stats.priorityCounts).filter(([_, count]) => count > 0).map(([priority, count]) => ({
                  name: priority.charAt(0).toUpperCase() + priority.slice(1),
                  value: count
                }))}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {Object.entries(stats.priorityCounts).filter(([_, count]) => count > 0).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks by List */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by List</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.listCounts.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Trend */}
        <div className="bg-white rounded-lg p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Task Completion</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="tasks" stroke="#3b82f6" name="Total Tasks" />
              <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Productivity Insights */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Productivity Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h4 className="font-medium text-gray-900">Velocity</h4>
            </div>
            <p className="text-sm text-gray-600">
              {stats.velocity > 1 ? `+${Math.round((stats.velocity - 1) * 100)}%` : stats.velocity === 1 ? 'steady' : `${Math.round((1 - stats.velocity) * 100)}% decline`} vs last week
            </p>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <h4 className="font-medium text-gray-900">Avg Task Duration</h4>
            </div>
            <p className="text-sm text-gray-600">
              {stats.avgTaskDuration > 0 ? `${stats.avgTaskDuration}h` : 'No data'}
            </p>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="w-5 h-5 text-green-500" />
              <h4 className="font-medium text-gray-900">Completion Rate</h4>
            </div>
            <p className="text-sm text-gray-600">
              {Math.round(stats.productivity)}% of tasks completed
            </p>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <LayoutDashboard className="w-5 h-5 text-purple-500" />
              <h4 className="font-medium text-gray-900">Priority Balance</h4>
            </div>
            <p className="text-sm text-gray-600">
              {Math.round(stats.priorityCounts.urgent / (tasks.length || 1) * 100)}% urgent /
              {Math.round(stats.priorityCounts.high / (tasks.length || 1) * 100)}% high /
              {Math.round(stats.priorityCounts.normal / (tasks.length || 1) * 100)}% normal /
              {Math.round(stats.priorityCounts.low / (tasks.length || 1) * 100)}% low
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}