import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'

interface LeaderboardEntry {
  id: string
  rank: number
  score: number
  previousRank?: number
  user?: {
    id: string
    name?: string
    image?: string
  }
}

interface LeaderboardProps {
  type: 'points' | 'level' | 'streak' | 'tasks_completed' | 'challenges_won'
  period: 'daily' | 'weekly' | 'monthly' | 'all_time'
  limit?: number
  userId?: string
}

export default function Leaderboard({
  type,
  period,
  limit = 10,
  userId,
}: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        type,
        period,
        limit: limit.toString(),
      })
      if (userId) {
        params.append('userId', userId)
      }
      const response = await fetch(`/api/gamification/leaderboard?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard')
      }
      const data = await response.json()
      setEntries(data.leaderboard?.entries || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [type, period, limit, userId])

  useEffect(() => {
    fetchLeaderboard()
  }, [type, period, limit, userId, fetchLeaderboard])

  const getRankChange = (rank: number, previousRank?: number) => {
    if (!previousRank) return { text: 'NEW', className: 'text-gray-500' }
    if (previousRank < rank) return { text: `↑${previousRank - rank}`, className: 'text-green-500' }
    if (previousRank > rank) return { text: `↓${rank - previousRank}`, className: 'text-red-500' }
    return { text: '—', className: 'text-gray-500' }
  }

  const formatScore = (score: number, type: string) => {
    if (type === 'points') return score.toLocaleString() + ' pts'
    if (type === 'level') return 'Lv. ' + score
    if (type === 'streak') return score + ' days'
    if (type === 'tasks_completed') return score.toLocaleString() + ' tasks'
    return score.toString()
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading leaderboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 text-red-500">
        Error loading leaderboard: {error}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="font-medium text-gray-900 capitalize">{type.replace('_', ' ')} Leaderboard ({period})</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Change
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map((entry) => {
              const isCurrentUser = userId && entry.user?.id === userId
              const rankChange = getRankChange(entry.rank, entry.previousRank)

              return (
                <tr
                  key={entry.id}
                  className={`hover:bg-gray-50 ${isCurrentUser ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${entry.rank <= 3 ? 'text-yellow-600' : 'text-gray-900'}`}>
                        {entry.rank === 1 && '🥇'}
                        {entry.rank === 2 && '🥈'}
                        {entry.rank === 3 && '🥉'}
                        {entry.rank > 3 && `#${entry.rank}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        {entry.user?.image ? (
                          <Image
                            src={entry.user.image}
                            alt={entry.user.name || 'User'}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-500">
                            {entry.user?.name?.charAt(0) || '?'}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isCurrentUser ? 'text-blue-600' : 'text-gray-900'}`}>
                          {entry.user?.name || 'Unknown User'}
                          {isCurrentUser && <span className="ml-2 text-xs text-blue-500">(You)</span>}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatScore(entry.score, type)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${rankChange.className}`}>
                      {rankChange.text}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {entries.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No leaderboard data available yet. Be the first to compete!
        </div>
      )}

      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <select
            className="border rounded px-2 py-1 text-sm"
            defaultValue={period}
            onChange={(e) => {
              // This would trigger a refetch in a real implementation
            }}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="all_time">All Time</option>
          </select>
        </div>
      </div>
    </div>
  )
}