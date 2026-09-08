"use client"

import { useTaskContext } from '@/src/hooks/useTasks'
import { useGamification } from '@/src/hooks/useTasks'

export default function GamificationPanel({ onClose }: { onClose: () => void }) {
  const { gamification, loading, error } = useGamification('demo')

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center p-4">
        <div className="bg-white rounded-xl p-6 max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Error Loading Gamification</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button onClick={onClose} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Close
          </button>
        </div>
      </div>
    )
  }

  if (!gamification) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center p-4">
        <div className="bg-white rounded-xl p-6 max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">No Gamification Data</h2>
          <p className="text-gray-600 mb-4">Complete tasks to start earning points and badges!</p>
          <button onClick={onClose} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Gamification & Achievements</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900">Current Streak</h3>
              <p className="text-2xl font-bold text-blue-600">{gamification.currentStreak} days</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h3 class="text-sm font-medium text-green-900">Longest Streak</h3>
              <p className="text-2xl font-bold text-green-600">{gamification.longestStreak} days</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 class="text-sm font-medium text-purple-900">Daily Goal Progress</h3>
              <div className="flex items-center space-x-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full">
                  <div
                    className={`h-2 bg-purple-500 rounded-full transition-all duration-500`}
                    style={{
                      width: `${Math.min(100, (gamification.dailyGoalProgress / gamification.dailyGoal) * 100)}%`
                    }}
                  />
                </div>
                <span>{gamification.dailyGoalProgress}/{gamification.dailyGoal}</span>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-3">Earned Badges</h3>
            <div className="flex flex-wrap gap-3 max-h-[200px] overflow-y-auto">
              {gamification.badges?.map((badge: string, index: number) => (
                <div key={index} className="bg-yellow-50 rounded-lg p-3 flex items-center space-x-2">
                  <span className="text-2xl text-yellow-400">🏅</span>
                  <span className="text-sm font-medium text-gray-800">{badge}</span>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">No badges earned yet</p>
              )}
            </div>
          </div>

          {/* Progress Tracking */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Task Completion Trend</h3>
            <div className="h-24 bg-gray-200 rounded-lg overflow-hidden relative">
              <div
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-green-500 opacity-20"
                style={{ width: '60%' }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">
              Based on your recent activity
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}