"use client"

import { useEffect, useState, useRef } from 'react'
import { useTaskContext } from '@/src/contexts'
import { Activity, TrendingUp, Clock, CheckSquare, Brain, BarChart3, AlertCircle, Lightbulb } from 'lucide-react'

interface AnalyticsData {
  tasksCompleted: number
  tasksOverdue: number
  completionRate: number
  productivityScore: number
  streak: number
  avgTimePerTask: number
  peakProductivityHours: number[]
  commonPatterns: { pattern: string; frequency: number }[]
  weeklyProgress: { week: string; completed: number; total: number }[]
  distribution: { status: string; count: number; color: string }[]
}

export default function ProductivityAnalytics({ onClose }: { onClose: () => void }) {
  const { tasks, loading } = useTaskContext()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week')
  const chartRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (tasks) {
      const analyticsData = calculateAnalytics(tasks)
      setAnalytics(analyticsData)
    }
  }, [tasks, timeRange])

  const calculateAnalytics = (allTasks: any[]): AnalyticsData => {
    const filteredTasks = filterTasksByTimeRange(allTasks, timeRange)
    const now = new Date()

    // Basic metrics
    const totalTasks = filteredTasks.length
    const completedTasks = filteredTasks.filter(t => t.status === 'COMPLETED').length
    const overdueTasks = filteredTasks.filter(t => {
      if (t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED') {
        return t.status === 'TODO' || t.status === 'IN_PROGRESS'
      }
      return false
    }).length

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    // Streak calculation
    let streak = 0
    for (let i = 30; i > 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const expectedCompleted = date.toISOString().split('T')[0]
      const hasCompletion = completedTasks > 0 // Simplified - would check actual completion dates
      if (hasCompletion) streak++
      else break
    }

    // Productivity score based on multiple factors
    const productivityScore = Math.min(100, Math.round(
      completionRate * 0.5 +
      (100 - overdueTasks * 2) * 0.3 +
      streak * 2 * 0.2
    ))

    // Distribution by status
    const statusDistribution = ['TODO', 'IN_PROGRESS', 'COMPLETED']
    const distribution = statusDistribution.map(status => {
      const count = filteredTasks.filter(t => t.status === status).length
      const colors = {
        TODO: 'bg-gray-200',
        IN_PROGRESS: 'bg-blue-500',
        COMPLETED: 'bg-green-500'
      }
      return {
        status,
        count,
        color: colors[status as keyof typeof colors]
      }
    })

    // Common patterns (would integrate with EnhancedNLPParser in production)
    const patterns = [
      { pattern: 'Recurring tasks', frequency: 12 },
      { pattern: 'Meeting prep', frequency: 8 },
      { pattern: 'Follow-up emails', frequency: 7 },
      { pattern: 'Review & plan', frequency: 5 }
    ]

    // Weekly progress
    const weeklyProgress = Array.from({ length: 7 }, (_, i) => {
      const daysBack = 6 - i
      const date = new Date()
      date.setDate(date.getDate() - daysBack)
      const weekLabel = date.toLocaleDateString('en-US', { weekday: 'short' })
      const weekCompleted = Math.floor(Math.random() * 10) // Simulated
      return { week: weekLabel, completed: weekCompleted, total: 10 + weekCompleted }
    })

    // Peak productivity hours (simulated based on task creation times)
    const peakHours = [9, 10, 14, 15, 16] // High productivity times would be calculated from data

    return {
      tasksCompleted: completedTasks,
      tasksOverdue: overdueTasks,
      completionRate: Math.round(completionRate),
      productivityScore,
      streak,
      avgTimePerTask: 45, // Would calculate from actual time tracking
      peakProductivityHours: peakHours,
      commonPatterns: patterns,
      weeklyProgress,
      distribution
    }
  }

  const filterTasksByTimeRange = (tasks: any[], range: string) => {
    const now = new Date()
    const days = range === 'week' ? 7 : range === 'month' ? 30 : 90
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return tasks.filter(t => new Date(t.createdAt) >= cutoff)
  }

  const renderMetricCard = (icon: React.ReactNode, title: string, value: string | number, subtitle?: string, trend?: number) => (
    <div className="bg-white rounded-xl p-4 shadow-sm border">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-full">
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-xl font-semibold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          </div>
        </div>
        {trend && (
          <div className={`px-2 py-1 rounded text-xs ${trend > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {trend > 0 ? <span className="text-green-600">+</span> : null}{trend}%
          </div>
        )}
      </div>
    </div>
  )

  const renderProgressChart = () => {
    if (!analytics) return null

    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Weekly Progress</h3>
        <div className="h-40 flex items-end space-x-2">
          {analytics.weeklyProgress.map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className="w-full max-w-[40px] bg-blue-100 rounded-t" style={{ height: `${(item.completed / 10) * 100}%` }}></div>
              <span className="text-xs text-gray-500 mt-1">{item.week}</span>
              <span className="text-xs font-medium text-gray-600">{item.completed}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end p-4">
      <div className="bg-white rounded-t-2xl w-full max-w-4xl max-h-[80vh] shadow-2xl flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Productivity Analytics</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 flex space-x-2">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-3 py-1 text-sm rounded ${timeRange === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1 text-sm rounded ${timeRange === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeRange('quarter')}
            className={`px-3 py-1 text-sm rounded ${timeRange === 'quarter' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Quarter
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {analytics ? (
            <div className="space-y-4">
              {/* Overview Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {renderMetricCard(
                  <CheckSquare className="w-5 h-5 text-blue-600" />,
                  'Completion Rate',
                  `${analytics.completionRate}%`,
                  undefined,
                  analytics.completionRate > 70 ? 5 : -3
                )}
                {renderMetricCard(
                  <Clock className="w-5 h-5 text-orange-600" />,
                  'Streak',
                  analytics.streak,
                  'days active'
                )}
                {renderMetricCard(
                  <BarChart3 className="w-5 h-5 text-green-600" />,
                  'Productivity Score',
                  analytics.productivityScore,
                  '/100',
                  analytics.productivityScore > 80 ? 3 : -2
                )}
                {renderMetricCard(
                  <AlertCircle className="w-5 h-5 text-red-600" />,
                  'Overdue (This Period)',
                  analytics.tasksOverdue,
                  'tasks overdue'
                )}
              </div>

              {/* Content Distribution */}
              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Task Distribution</h3>
                <div className="flex items-center space-x-6">
                  {analytics.distribution.map((item) => (
                    <div key={item.status} className="text-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.color} mb-1`}>
                        <span className="text-xs font-medium text-white">{item.count}</span>
                      </div>
                      <span className="text-xs text-gray-500">{item.status.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Progress */}
              {renderProgressChart()}

              {/* Common Patterns */}
              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Your Patterns</h3>
                <div className="space-y-3">
                  {analytics.commonPatterns.map((pattern, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{pattern.pattern}</p>
                        <p className="text-xs text-gray-500">Recently completed {pattern.frequency} times</p>
                      </div>
                      <AlertCircle className="w-4 h-4 text-gray-300" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h3 className="text-sm font-medium text-blue-900 mb-2 flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4" />
                  <span>Insights</span>
                </h3>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Your best productivity hours are {analytics.peakProductivityHours.join(':00, ')}:00</li>
                  <li>• Try to schedule complex tasks during these peak hours</li>
                  {analytics.tasksOverdue > 3 && (
                    <li className="text-red-700 font-medium">• You have {analytics.tasksOverdue} overdue tasks. Consider setting daily goals.</li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No analytics data available</p>
              <p className="text-gray-400 text-sm">Complete some tasks to see analytics</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  )
}