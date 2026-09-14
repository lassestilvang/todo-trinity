import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

interface Reward {
  id: string
  type: 'badge' | 'points' | 'level_boost' | 'feature_unlock' | 'theme'
  value: string | number | boolean
  description: string
  cost: number
  isClaimed: boolean
  isUnlocked: boolean
}

interface RewardStoreProps {
  userId: string
}

export default function RewardStore({ userId }: RewardStoreProps) {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [claimedRewards, setClaimedRewards] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const router = useRouter()

  const fetchRewards = async () => {
    setIsLoading(true)
    try {
      // In a real app, this would be an API call
      // For now, use mock data
      const mockRewards: Reward[] = [
        {
          id: 'points_small_boost',
          type: 'points',
          value: 100,
          description: '100 Bonus Points',
          cost: 100,
          isClaimed: false,
          isUnlocked: true,
        },
        {
          id: 'points_medium_boost',
          type: 'points',
          value: 500,
          description: '500 Bonus Points',
          cost: 500,
          isClaimed: false,
          isUnlocked: true,
        },
        {
          id: 'points_large_boost',
          type: 'points',
          value: 1000,
          description: '1000 Bonus Points',
          cost: 1000,
          isClaimed: false,
          isUnlocked: true,
        },
        {
          id: 'badge_completionist',
          type: 'badge',
          value: 'Completionist',
          description: 'Special badge for 100% task completion streak',
          cost: 800,
          isClaimed: false,
          isUnlocked: true,
        },
        {
          id: 'badge_overnight_owl',
          type: 'badge',
          value: 'Overnight Owl',
          description: 'Completed 10 tasks after midnight',
          cost: 600,
          isClaimed: false,
          isUnlocked: true,
        },
        {
          id: 'feature_priority_tags',
          type: 'feature_unlock',
          value: 'priority_tags',
          description: 'Unlock priority tagging system',
          cost: 1200,
          isClaimed: false,
          isUnlocked: true,
        },
        {
          id: 'theme_dark',
          type: 'theme',
          value: 'dark_mode',
          description: 'Unlock dark mode theme',
          cost: 300,
          isClaimed: false,
          isUnlocked: true,
        },
      ]
      setRewards(mockRewards)
    } catch (err) {
      setError('Failed to load rewards')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchClaimedRewards = async () => {
    try {
      // Mock claimed rewards
      setClaimedRewards([])
    } catch (err) {
      console.error('Failed to fetch claimed rewards')
    }
  }

  useEffect(() => {
    fetchRewards()
    fetchClaimedRewards()
  }, [userId])

  const handleClaim = async (reward: Reward) => {
    if (reward.isClaimed || !reward.isUnlocked) return

    try {
      // In a real app, this would be an API call
      // For now, just update local state
      setRewards((prev) =>
        prev.map((r) => (r.id === reward.id ? { ...r, isClaimed: true } : r))
      )
      setClaimedRewards((prev) => [...prev, reward.id])
      showToast(`Successfully claimed: ${reward.description}`, 'success')
    } catch (err) {
      showToast('Failed to claim reward', 'error')
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'points': return '💰'
      case 'badge': return '🏆'
      case 'level_boost': return '⬆️'
      case 'feature_unlock': return '🔓'
      case 'theme': return '🎨'
      default: return '🎁'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'points': return 'bg-green-100 text-green-800'
      case 'badge': return 'bg-yellow-100 text-yellow-800'
      case 'level_boost': return 'bg-blue-100 text-blue-800'
      case 'feature_unlock': return 'bg-purple-100 text-purple-800'
      case 'theme': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading rewards...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 text-red-500">
        Error loading rewards: {error}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900 flex items-center space-x-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h12M8 14h12M8 18h12M4 6l4 8 4-8 4 8 4-8" />
          </svg>
          Reward Store
        </h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
            Points: 2,500
          </span>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg animate-slide-up ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}
        >
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((reward) => (
          <motion.div
            key={reward.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative p-4 rounded-lg border ${
              reward.isClaimed
                ? 'bg-green-50 border-green-200'
                : reward.isUnlocked
                ? 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                : 'bg-gray-50 border-gray-200 opacity-50'
            } transition-all`}
          >
            <div className="flex items-start space-x-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getTypeColor(reward.type)}`}>
                <span className="text-xl">{getTypeIcon(reward.type)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {typeof reward.value === 'string' ? reward.value : reward.description}
                </h4>
                <p className="text-sm text-gray-600 mt-1 truncate">{reward.description}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                    {reward.cost.toLocaleString()} pts
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3">
              {reward.isClaimed ? (
                <button
                  className="w-full bg-green-500 text-white px-4 py-2 rounded-lg disabled:bg-green-300 cursor-not-allowed"
                  disabled
                >
                  ✓ Claimed
                </button>
              ) : reward.isUnlocked ? (
                <button
                  onClick={() => handleClaim(reward)}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Claim
                </button>
              ) : (
                <button
                  className="w-full bg-gray-300 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed"
                  disabled
                >
                  Locked
                </button>
              )}
            </div>

            {reward.isClaimed && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {rewards.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No rewards available at the moment
        </div>
      )}
    </div>
  )
}