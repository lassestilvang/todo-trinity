"use client"

import { useState, useEffect, useCallback } from 'react'
import { useTaskContext } from '@/src/contexts'
import { useToast } from '@/src/hooks/useToast'
import { motion } from 'framer-motion'
import { Timer, Play, Pause, Settings, X, Target, CheckCircle, Bell } from 'lucide-react'

interface FocusModeProps {
  onClose: () => void
}

export default function FocusMode({ onClose }: FocusModeProps) {
  const { tasks, loading } = useTaskContext()
  const { addToast } = useToast()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [duration, setDuration] = useState(25) // minutes
  const [shortBreak, setShortBreak] = useState(5)
  const [longBreak, setLongBreak] = useState(15)
  const [sessionsUntilLongBreak, setSessionsUntilLongBreak] = useState(4)
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(duration * 60)
  const [currentSession, setCurrentSession] = useState(1)
  const [isBreak, setIsBreak] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [autoStartBreaks, setAutoStartBreaks] = useState(false)
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(false)

  // Reset timer when duration changes
  useEffect(() => {
    if (!isRunning && !isBreak) {
      setTimeLeft(duration * 60)
    }
  }, [duration, isRunning, isBreak])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      handleTimerComplete()
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeLeft])

  const handleTimerComplete = useCallback(() => {
    if (soundEnabled && typeof window !== 'undefined') {
      // Play a notification sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
      audio.play().catch(() => {}) // Ignore play errors
    }

    if (!isBreak) {
      // Pomodoro completed
      addToast(`Focus session complete! Take a break.`, 'success')
      setCurrentSession(prev => prev + 1)

      if (selectedTaskId) {
        // Update task progress or log completion
        addToast(`Focus session logged for selected task`, 'info')
      }

      // Check if it's time for a long break
      if (currentSession % sessionsUntilLongBreak === 0) {
        setIsBreak(true)
        setTimeLeft(longBreak * 60)
        addToast(`Long break time! (${longBreak} minutes)`, 'info')
      } else {
        setIsBreak(true)
        setTimeLeft(shortBreak * 60)
        addToast(`Short break time! (${shortBreak} minutes)`, 'info')
      }

      if (!autoStartBreaks) {
        setIsRunning(false)
      }
    } else {
      // Break completed
      addToast(`Break over! Ready for next focus session?`, 'info')
      setIsBreak(false)
      setTimeLeft(duration * 60)

      if (!autoStartPomodoros) {
        setIsRunning(false)
      }
    }
  }, [isBreak, soundEnabled, currentSession, sessionsUntilLongBreak, longBreak, shortBreak, duration, selectedTaskId, autoStartBreaks, autoStartPomodoros, addToast])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = isBreak
    ? 1 - timeLeft / ((currentSession % sessionsUntilLongBreak === 0 ? longBreak : shortBreak) * 60)
    : 1 - timeLeft / (duration * 60)

  const availableTasks = tasks.filter(t => t.status !== 'COMPLETED')

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] shadow-2xl overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Focus Mode</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Focus Duration (min)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Math.max(1, Math.min(60, parseInt(e.target.value) || 25)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Break (min)</label>
                <input
                  type="number"
                  value={shortBreak}
                  onChange={(e) => setShortBreak(Math.max(1, Math.min(30, parseInt(e.target.value) || 5)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Long Break (min)</label>
                <input
                  type="number"
                  value={longBreak}
                  onChange={(e) => setLongBreak(Math.max(5, Math.min(60, parseInt(e.target.value) || 15)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sessions until Long Break</label>
                <input
                  type="number"
                  value={sessionsUntilLongBreak}
                  onChange={(e) => setSessionsUntilLongBreak(Math.max(2, Math.min(10, parseInt(e.target.value) || 4)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Sound notifications</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoStartBreaks}
                  onChange={(e) => setAutoStartBreaks(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Auto-start breaks</span>
              </label>
            </div>
            <div className="flex items-center space-x-4 mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoStartPomodoros}
                  onChange={(e) => setAutoStartPomodoros(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Auto-start sessions</span>
              </label>
            </div>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Task Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Task (Optional)</label>
            <select
              value={selectedTaskId || ''}
              onChange={(e) => setSelectedTaskId(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No task selected - General focus</option>
              {availableTasks.map(task => (
                <option key={task.id} value={task.id}>
                  {task.title} ({task.priority})
                </option>
              ))}
            </select>
          </div>

          {/* Timer Display */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            <div className="relative w-64 h-64 mx-auto">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  stroke={isBreak ? '#10b981' : '#3b82f6'}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 110}
                  strokeDashoffset={2 * Math.PI * 110 * (1 - progress)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-mono font-bold text-gray-900">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm text-gray-500 mt-1 capitalize">
                  {isBreak ? 'break' : 'focus'}
                </div>
                {selectedTaskId && (
                  <div className="mt-2 text-xs text-blue-600 text-center px-2">
                    {tasks.find(t => t.id === selectedTaskId)?.title}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Progress Indicator */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2">
              {Array.from({ length: sessionsUntilLongBreak }, (_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    i + 1 < currentSession
                      ? 'bg-green-500 text-white'
                      : i + 1 === currentSession
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {i + 1 < currentSession ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    i + 1
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Session {currentSession} of {sessionsUntilLongBreak} until long break
            </p>
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setIsRunning(!isRunning)}
              disabled={timeLeft === 0 && !isBreak}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl shadow-lg transition-all ${
                isRunning
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </button>

            <button
              onClick={() => {
                setIsRunning(false)
                setTimeLeft(isBreak ? (currentSession % sessionsUntilLongBreak === 0 ? longBreak : shortBreak) * 60 : duration * 60)
              }}
              className="w-16 h-16 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-2xl hover:bg-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5m0 0l5-5m-5 5h10m0 0l-5-5m5 5v10m0 0l5 5m-5-5h-10" />
              </svg>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsRunning(false)
                setIsBreak(false)
                setTimeLeft(duration * 60)
              }}
              className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              Reset
            </button>
            <button
              onClick={() => {
                setIsRunning(false)
                setIsBreak(!isBreak)
                setTimeLeft(isBreak ? duration * 60 : (currentSession % sessionsUntilLongBreak === 0 ? longBreak : shortBreak) * 60)
              }}
              className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              {isBreak ? 'Focus' : 'Break'}
            </button>
            <button
              onClick={() => {
                setIsRunning(false)
                setTimeLeft(isBreak ? (currentSession % sessionsUntilLongBreak === 0 ? longBreak : shortBreak) * 60 + 60 : duration * 60 + 60)
                setIsRunning(true)
              }}
              className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              +1 min
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{currentSession}</p>
              <p className="text-xs text-gray-500">Sessions Done</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {Math.floor(((currentSession - 1) * duration + (currentSession - 1) * shortBreak) / 60)}h
              </p>
              <p className="text-xs text-gray-500">Focus Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {Math.floor(((currentSession - 1) * shortBreak) / 60)}h
              </p>
              <p className="text-xs text-gray-500">Break Time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}