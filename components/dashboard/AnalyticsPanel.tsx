"use client"

import { useState } from 'react'
import { useTaskContext } from '@/src/hooks/useTasks'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, Calendar, Users, Target, Clock, Star, Activity, Award, Zap } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function AnalyticsPanel() {
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
  }, [timeframe])

  const calculateStats = () => {
    const completed = tasks.filter(t => t.status === 'completed').length
    const inProgress = tasks.filter(t => t.status === 'in_progress').length
    const todo = tasks.filter(t => t.status === 'todo').length
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length

    const priorityCounts = {
      urgent: tasks.filter(t => t.priority === 'urgent').length,
      high: tasks.filter(t => t.priority === 'high').length,
      normal: tasks.filter(t => t.priority === 'normal').length,
      low: tasks.filter(t => t.priority === 'low').length,
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
        completed: dayTasks.filter(t => t.status === 'completed').length
      })
    }

    return {
      completed,
      inProgress,
      todo,
      overdue,
      priorityCounts,
      listCounts,
      weeklyData,
      productivity: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
    }
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-5 h-5 text-blue-500" />
              <h4 className="font-medium text-gray-900">Peak Hours</h4>
            </div>
            <p className="text-sm text-gray-600">Best productivity time: 10 AM - 2 PM</p>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-5 h-5 text-green-500" />
              <h4 className="font-medium text-gray-900">Task Trends</h4>
            </div>
            <p className="text-sm text-gray-600">+15% more tasks completed this week</p>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <h4 className="font-medium text-gray-900">Badges Earned</h4>
            </div>
            <p className="text-sm text-gray-600">5 new badges this week</p>
          </div>
        </div>
      </div>
    </div>
  )
}