import { useState, useEffect } from 'react'
import { useGamification } from '@/src/hooks/useTasks'
import Button from '@/components/ui/button'
import { useRouter } from 'next/router'

interface Achievement {
  id: string
  name: string
  description?: string
  icon: string
  category: string
  points: number
  rarity: string
  isUnlocked: boolean
}

interface UserPoints {
  totalPoints: number
  level: number
  currentLevelXp: number
  levelXpRequired: number
}

export default function GamificationPanel({ onClose }: { onClose?: () => void }) {
  const gamification = useGamification('')
  const { streak, points, achievements, level } = gamification.gamification || {}
  const isLoading = gamification.loading
  const [panelOpen, setPanelOpen] = useState<string | null>(null) // 'achievements' | 'leaderboard' | 'challenges' | 'rewards'
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          {onClose && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
            >
              ← Back
            </Button>
          )}
          <h3 className="font-medium text-gray-900">Gamification Hub</h3>
          <div></div> {/* Spacer */}
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading gamification data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Gamification Stats */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 flex items-center space-x-2">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2v0H7a2 2 0 01-2-2h.012V7a2 2 0 012-2h2.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01-.293.707V19a2 2 0 01-2 2h-1z" />
            </svg>
            Gamification Hub
          </h3>
          <div className="flex space-x-2">
            <Button
              onClick={() => setPanelOpen('achievements')}
              variant="outline"
              size="sm"
            >
              Achievements
            </Button>
            <Button
              onClick={() => setPanelOpen('leaderboard')}
              variant="outline"
              size="sm"
            >
              Leaderboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{streak?.currentStreak || 0}</div>
            <div className="text-sm text-gray-500">Current Streak</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{streak?.longestStreak || 0}</div>
            <div className="text-sm text-gray-500">Longest Streak</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">{level || 1}</div>
            <div className="text-sm text-gray-500">Level</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-orange-600">{points?.totalPoints || 0}</div>
            <div className="text-sm text-gray-500">Points</div>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="font-medium text-gray-900 mb-2">Daily Goal Progress</h4>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (streak?.dailyGoalProgress || 0) / (streak?.dailyGoal || 1) * 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>{streak?.dailyGoalProgress || 0}/{streak?.dailyGoal || 0} Tasks</span>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-4">
          <h4 className="font-medium text-gray-900 mb-2">Earned Badges</h4>
          <div className="flex flex-wrap gap-2">
            {streak?.badges?.map((badge: string, index: number) => {
              let icon = '🏆'
              let color = 'gray'
              if (badge.includes('Getting Started')) {
                icon = '🔥'
                color = 'red'
              } else if (badge.includes('Weekly Warrior')) {
                icon = '⭐'
                color = 'yellow'
              } else if (badge.includes('Monthly Master')) {
                icon = '🏆'
                color = 'green'
              }
              return (
                <span
                  key={index}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    color === 'red'
                      ? 'bg-red-100 text-red-800'
                      : color === 'yellow'
                      ? 'bg-yellow-100 text-yellow-800'
                      : color === 'green'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {icon} {badge}
                </span>
              )
            }) || []}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <h4 className="font-medium text-gray-900 mb-2">Progress to Next Level</h4>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${level && level.levelXpRequired ? ((level.currentLevelXp || 0) / level.levelXpRequired) * 100 : 0}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>{level?.currentLevelXp || 0}/{level?.levelXpRequired || 0} XP</span>
          </div>
        </div>
      </div>

      {/* Panel Content */}
      {panelOpen === 'achievements' && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => setPanelOpen(null)}
              variant="ghost"
              size="sm"
            >
              ← Back
            </Button>
            <h3 className="font-medium text-gray-900">Achievements</h3>
          </div>
          <div className="space-y-2">
            {achievements?.map((achievement: Achievement) => (
              <div
                key={achievement.id}
                className={`flex items-center space-x-3 p-3 border rounded-lg ${
                  achievement.isUnlocked
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gray-200">
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{achievement.name}</h4>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs font-medium">
                      {achievement.points} pts
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      achievement.rarity === 'COMMON'
                        ? 'bg-gray-200 text-gray-800'
                        : achievement.rarity === 'UNCOMMON'
                        ? 'bg-blue-200 text-blue-800'
                        : achievement.rarity === 'RARE'
                        ? 'bg-purple-200 text-purple-800'
                        : achievement.rarity === 'EPIC'
                        ? 'bg-red-200 text-red-800'
                        : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      {achievement.rarity}
                    </span>
                  </div>
                </div>
                <div className="w-20">
                  {achievement.isUnlocked ? (
                    <span className="text-green-500 font-medium">Unlocked</span>
                  ) : (
                    <Button
                      onClick={() => alert('Claim achievement feature coming soon!')}
                      variant="outline"
                      size="sm"
                    >
                      Claim
                    </Button>
                  )}
                </div>
              </div>
            )) || []}
          </div>
        </div>
      )}

      {panelOpen === 'leaderboard' && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => setPanelOpen(null)}
              variant="ghost"
              size="sm"
            >
              ← Back
            </Button>
            <h3 className="font-medium text-gray-900">Leaderboard</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-3">
              <select className="border rounded px-2 py-1">
                <option value="points">Points</option>
                <option value="level">Level</option>
                <option value="streak">Streak</option>
                <option value="tasks_completed">Tasks Completed</option>
              </select>
              <select className="border rounded px-2 py-1">
                <option value="daily">Daily</option>
                <option value="weekly" selected>
                  Weekly
                </option>
                <option value="monthly">Monthly</option>
                <option value="all_time">All Time</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((rank) => (
                    <tr key={rank} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        #{rank}
                      </td>
                      <td className="px-4 py-3 flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          {rank <= 3 ? '🏆' : '👤'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            User {rank}
                          </p>
                          <p className="text-xs text-gray-500">
                            Active today
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {1000 - rank * 50}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {rank === 1 ? (
                          <span className="text-green-500">+2</span>
                        ) : rank === 2 ? (
                          <span className="text-yellow-500">-1</span>
                        ) : (
                          <span className="text-red-500">+{rank}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {panelOpen === 'challenges' && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => setPanelOpen(null)}
              variant="ghost"
              size="sm"
            >
              ← Back
            </Button>
            <h3 className="font-medium text-gray-900">Challenges</h3>
          </div>
          <div className="space-y-3">
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Active Challenges</h4>
              <div className="space-y-2">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full">
                      ⚡
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Weekly Sprint</h4>
                      <p className="text-sm text-gray-600">
                        Complete 15 tasks this week to earn bonus points
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                          7 days left
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          12/15 tasks
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => alert('Join challenge feature coming soon!')}
                      variant="outline"
                      size="sm"
                    >
                      Join Challenge
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {panelOpen === 'rewards' && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => setPanelOpen(null)}
              variant="ghost"
              size="sm"
            >
              ← Back
            </Button>
            <h3 className="font-medium text-gray-900">Reward Store</h3>
          </div>
          <div className="space-y-3">
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Available Rewards</h4>
              <div className="space-y-2">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-purple-100 rounded-full">
                      🎁
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">100 Bonus Points</h4>
                      <p className="text-sm text-gray-600">
                        Boost your points with this instant reward
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800">
                          Cost: 100 pts
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => alert('Reward redemption feature coming soon!')}
                      variant="outline"
                      size="sm"
                    >
                      Redeem
                    </Button>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-yellow-100 rounded-full">
                      🏆
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Achievement Hunter Badge</h4>
                      <p className="text-sm text-gray-600">
                        Special badge for completing multiple achievements
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800">
                          Cost: 500 pts
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => alert('Reward redemption feature coming soon!')}
                      variant="outline"
                      size="sm"
                    >
                      Redeem
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}