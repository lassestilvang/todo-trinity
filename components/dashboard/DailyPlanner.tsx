"use client"

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'
import { Zap, Clock, Coffee, AlertTriangle, Lightbulb, ChevronLeft, ChevronRight, Settings, Calendar } from 'lucide-react'
import { useTaskContext } from '@/src/contexts'
import { useToast } from '@/src/hooks/useToast'
import { TaskStatus, Priority } from '@/src/types/index'

interface TimeBlock {
  startTime: string
  endTime: string
  taskId: string
  taskTitle: string
  priority: Priority
  type: 'task' | 'break' | 'meeting' | 'focus' | 'buffer'
  energyLevel: 'high' | 'medium' | 'low'
}

interface DailyPlan {
  date: string
  timeBlocks: TimeBlock[]
  totalFocusTime: number
  totalBreakTime: number
  totalMeetingTime: number
  tasksScheduled: number
  tasksUnscheduled: string[]
  energyCurve: Array<{ hour: number; level: 'high' | 'medium' | 'low' }>
  recommendations: string[]
  warnings: string[]
}

interface UserPreferences {
  workStartHour: number
  workEndHour: number
  preferredBreakDuration: number
  maxFocusSession: number
  lunchStartHour: number
  lunchDuration: number
  bufferBetweenTasks: number
}

export default function DailyPlanner({ onClose }: { onClose: () => void }) {
  const { tasks } = useTaskContext()
  const { addToast } = useToast()
  const queryClient = useQueryClient()

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState<UserPreferences>({
    workStartHour: 9,
    workEndHour: 17,
    preferredBreakDuration: 15,
    maxFocusSession: 90,
    lunchStartHour: 12,
    lunchDuration: 60,
    bufferBetweenTasks: 10
  })

  // Fetch daily plan
  const { data: plan, isLoading, error, refetch } = useQuery<DailyPlan>({
    queryKey: ['daily-plan', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const res = await fetch(`/api/ai/daily-plan?date=${format(selectedDate, 'yyyy-MM-dd')}`, {
        cache: 'no-store'
      })
      if (!res.ok) throw new Error('Failed to fetch daily plan')
      return res.json()
    },
    enabled: !!window?.location?.hostname
  })

  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (prefs: Partial<UserPreferences>) => {
      const res = await fetch('/api/ai/daily-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: prefs })
      })
      if (!res.ok) throw new Error('Failed to save preferences')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-plan'] })
      addToast('Preferences saved', 'success')
      setShowPreferences(false)
    },
    onError: (err: Error) => {
      addToast(err.message, 'error')
    }
  })

  // Load preferences on mount
  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const res = await fetch('/api/ai/daily-plan', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.preferences) {
          setPreferences(prev => ({ ...prev, ...data.preferences }))
        }
      }
    } catch (err) {
      console.error('Failed to load preferences:', err)
    }
  }

  const handleDateChange = (delta: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + delta)
    setSelectedDate(newDate)
  }

  const handleSavePreferences = () => {
    savePreferencesMutation.mutate(preferences)
  }

  const formatTime = (timeString: string) => {
    const date = parseISO(timeString)
    return format(date, 'h:mm a')
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500'
      case 'HIGH': return 'bg-orange-500'
      case 'NORMAL': return 'bg-blue-500'
      case 'LOW': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'focus': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'meeting': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
      case 'break': return 'bg-green-100 text-green-700 border-green-200'
      case 'buffer': return 'bg-gray-100 text-gray-700 border-gray-200'
      default: return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'focus': return <Zap className="w-3 h-3" />
      case 'meeting': return <Calendar className="w-3 h-3" />
      case 'break': return <Coffee className="w-3 h-3" />
      case 'buffer': return <Clock className="w-3 h-3" />
      default: return <Zap className="w-3 h-3" />
    }
  }

  const getEnergyColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleDateChange(-1)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {format(selectedDate, 'EEEE, MMMM d')}
              </h2>
              <p className="text-sm text-gray-500">
                {plan ? `${plan.tasksScheduled} tasks • ${formatMinutes(plan.totalFocusTime)} focus` : 'Generating plan...'}
              </p>
            </div>
            <button
              onClick={() => handleDateChange(1)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              aria-label="Next day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              aria-label="Preferences"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Preferences Modal */}
        {showPreferences && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPreferences(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Daily Planner Preferences</h3>
                <button onClick={() => setShowPreferences(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Start Time</label>
                  <select
                    value={preferences.workStartHour}
                    onChange={e => setPreferences(p => ({ ...p, workStartHour: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[6,7,8,9,10].map(h => <option key={h} value={h}>{h}:00 AM</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work End Time</label>
                  <select
                    value={preferences.workEndHour}
                    onChange={e => setPreferences(p => ({ ...p, workEndHour: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[16,17,18,19,20].map(h => <option key={h} value={h}>{h > 12 ? h-12 : h}:00 PM</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Focus Session (minutes)</label>
                  <input
                    type="number"
                    value={preferences.maxFocusSession}
                    onChange={e => setPreferences(p => ({ ...p, maxFocusSession: parseInt(e.target.value) }))}
                    min="30"
                    max="180"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Break Duration (minutes)</label>
                  <input
                    type="number"
                    value={preferences.preferredBreakDuration}
                    onChange={e => setPreferences(p => ({ ...p, preferredBreakDuration: parseInt(e.target.value) }))}
                    min="5"
                    max="60"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lunch Start</label>
                  <select
                    value={preferences.lunchStartHour}
                    onChange={e => setPreferences(p => ({ ...p, lunchStartHour: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[11,12,13,14].map(h => <option key={h} value={h}>{h === 12 ? '12:00 PM' : h > 12 ? `${h-12}:00 PM` : `${h}:00 AM`}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lunch Duration (minutes)</label>
                  <input
                    type="number"
                    value={preferences.lunchDuration}
                    onChange={e => setPreferences(p => ({ ...p, lunchDuration: parseInt(e.target.value) }))}
                    min="30"
                    max="120"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buffer Between Tasks (minutes)</label>
                  <input
                    type="number"
                    value={preferences.bufferBetweenTasks}
                    onChange={e => setPreferences(p => ({ ...p, bufferBetweenTasks: parseInt(e.target.value) }))}
                    min="0"
                    max="30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleSavePreferences}
                  disabled={savePreferencesMutation.isPending}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {savePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              Failed to load daily plan
            </div>
          ) : plan ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{plan.tasksScheduled}</div>
                  <div className="text-sm text-gray-500">Tasks Scheduled</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">{formatMinutes(plan.totalFocusTime)}</div>
                  <div className="text-sm text-gray-500">Focus Time</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{formatMinutes(plan.totalBreakTime)}</div>
                  <div className="text-sm text-gray-500">Break Time</div>
                </div>
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-indigo-600">{formatMinutes(plan.totalMeetingTime)}</div>
                  <div className="text-sm text-gray-500">Meetings</div>
                </div>
              </div>

              {/* Energy Curve */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span>Energy Curve</span>
                </h3>
                <div className="flex items-end gap-1 h-20">
                  {plan.energyCurve.map((point, index) => (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center justify-end gap-1"
                      title={`${point.hour}:00 - ${point.level} energy`}
                    >
                      <div
                        className={`w-full rounded-t ${getEnergyColor(point.level)} transition-all`}
                        style={{ height: `${point.level === 'high' ? '100%' : point.level === 'medium' ? '60%' : '30%'}` }}
                      />
                      <span className="text-xs text-gray-500">{point.hour}:00</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Schedule</h3>
                {plan.timeBlocks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No tasks scheduled for this day. Add tasks to see them here!
                  </div>
                ) : (
                  plan.timeBlocks.map((block, index) => {
                    const isTask = block.type === 'task' || block.type === 'focus'
                    const isBreak = block.type === 'break'
                    const isMeeting = block.type === 'meeting'

                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-4 p-3 rounded-lg border transition-all hover:shadow-md ${
                          isBreak ? 'bg-green-50 border-green-200' :
                          isMeeting ? 'bg-indigo-50 border-indigo-200' :
                          block.type === 'focus' ? 'bg-purple-50 border-purple-200' :
                          'bg-blue-50 border-blue-200'
                        }`}
                      >
                        {/* Time */}
                        <div className="w-24 flex-shrink-0 text-right pr-3 border-r border-gray-200">
                          <div className="text-sm font-medium text-gray-700">{formatTime(block.startTime)}</div>
                          <div className="text-xs text-gray-400">{formatTime(block.endTime)}</div>
                        </div>

                        {/* Visual connector */}
                        <div className="w-8 flex-shrink-0 flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(block.priority)}`} />
                          {index < plan.timeBlocks.length - 1 && (
                            <div className="flex-1 w-0.5 bg-gray-200 mt-1" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(block.type)}`}>
                              {getTypeIcon(block.type)}
                              {block.type.charAt(0).toUpperCase() + block.type.slice(1)}
                            </span>
                            {isTask && (
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(block.priority)} text-white`}>
                                {block.priority}
                              </span>
                            )}
                            <span className={`ml-auto px-2 py-0.5 text-xs font-medium rounded-full ${getEnergyColor(block.energyLevel)} text-white`}>
                              {block.energyLevel} energy
                            </span>
                          </div>
                          <p className="font-medium text-gray-900 truncate">{block.taskTitle}</p>
                          {block.type === 'task' && block.taskId !== 'lunch' && (
                            <p className="text-xs text-gray-500 truncate">
                              {tasks.find(t => t.id === block.taskId)?.description || 'No description'}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Unscheduled Tasks */}
              {plan.tasksUnscheduled.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {plan.tasksUnscheduled.length} Tasks Couldn't Fit
                  </h4>
                  <ul className="space-y-1 text-sm text-yellow-700">
                    {plan.tasksUnscheduled.slice(0, 5).map(taskId => (
                      <li key={taskId} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                        {tasks.find(t => t.id === taskId)?.title || 'Unknown task'}
                      </li>
                    ))}
                    {plan.tasksUnscheduled.length > 5 && (
                      <li className="text-xs text-yellow-500">...and {plan.tasksUnscheduled.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {plan.warnings.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Warnings
                  </h4>
                  <ul className="space-y-1 text-sm text-red-700">
                    {plan.warnings.map((warning, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {plan.recommendations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Recommendations
                  </h4>
                  <ul className="space-y-1 text-sm text-blue-700">
                    {plan.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Select a date to generate your daily plan
            </div>
          )}
        </div>
      </div>
    </div>
  )
}