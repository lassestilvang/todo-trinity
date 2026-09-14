import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

interface Challenge {
  id: string
  title: string
  description?: string
  type: 'individual' | 'team' | 'workspace' | 'global'
  startDate: string
  endDate: string
  rewardPoints: number
  rewardBadgeId?: string
  maxParticipants?: number
  isActive: boolean
  progress: number
  score: number
  completed: boolean
  joinedAt?: string
}

interface ChallengeProps {
  userId: string
}

export default function TeamChallenges({ userId }: ChallengeProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'upcoming'>('active')
  const router = useRouter()

  useEffect(() => {
    const fetchChallenges = async () => {
      setIsLoading(true)
      try {
        // In a real app, this would be an API call
        // For now, use mock data
        const now = new Date()
        const mockChallenges: Challenge[] = [
          {
            id: 'chal1',
            title: 'Weekly Sprint Challenge',
            description: 'Complete 15 tasks this week to earn bonus points and a special badge',
            type: 'individual',
            startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2).toISOString(),
            endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5).toISOString(),
            rewardPoints: 200,
            rewardBadgeId: 'badge_weekly_warrior_plus',
            maxParticipants: 1000,
            isActive: true,
            progress: 7,
            score: 140,
            completed: false,
            joinedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString(),
          },
          {
            id: 'chal2',
            title: 'Workspace Collaboration Challenge',
            description: 'Work with your team to complete 50 tasks together',
            type: 'workspace',
            startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString(),
            endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14).toISOString(),
            rewardPoints: 500,
            rewardBadgeId: 'badge_collaborator',
            maxParticipants: 50,
            isActive: true,
            progress: 32,
            score: 320,
            completed: false,
            joinedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3).toISOString(),
          },
          {
            id: 'chal3',
            title: 'Monthly Master Challenge',
            description: 'Maintain a 30-day streak for ultimate recognition',
            type: 'individual',
            startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
            endDate: new Date(now.getFullYear(), now.getMonth(), 0).toISOString(),
            rewardPoints: 1000,
            rewardBadgeId: 'badge_monthly_master_elite',
            maxParticipants: 500,
            isActive: true,
            progress: 18,
            score: 540,
            completed: false,
            joinedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10).toISOString(),
          },
          {
            id: 'chal4',
            title: 'New Year Resolution Challenge',
            description: 'Start the year strong with 100 completed tasks',
            type: 'global',
            startDate: new Date(now.getFullYear(), 0, 1).toISOString(),
            endDate: new Date(now.getFullYear(), 0, 31).toISOString(),
            rewardPoints: 250,
            rewardBadgeId: 'badge_new_year_starter',
            maxParticipants: 10000,
            isActive: false,
            progress: 0,
            score: 0,
            completed: true,
            joinedAt: new Date(now.getFullYear(), 0, 2).toISOString(),
          },
        ]
        setChallenges(mockChallenges)
      } catch (err) {
        setError('Failed to load challenges')
      } finally {
        setIsLoading(false)
      }
    }

    fetchChallenges()
  }, [userId])

  const getStatusBadge = (challenge: Challenge) => {
    if (!challenge.isActive) {
      return {
        label: 'Completed',
        className: 'bg-green-100 text-green-800',
      }
    }
    if (challenge.completed) {
      return {
        label: 'Completed',
        className: 'bg-green-100 text-green-800',
      }
    }
    return {
      label: 'Active',
      className: 'bg-blue-100 text-blue-800',
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 75) return 'bg-yellow-400'
    if (progress >= 50) return 'bg-yellow-300'
    return 'bg-gray-200'
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading challenges...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 text-red-500">
        Error loading challenges: {error}
      </div>
    )
  }

  const filteredChallenges = challenges.filter((challenge) => {
    if (activeTab === 'active') return challenge.isActive && !challenge.completed
    if (activeTab === 'completed') return challenge.completed
    if (activeTab === 'upcoming') return !challenge.isActive && !challenge.completed
    return true
  })

  if (filteredChallenges.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 text-center">
        <p className="text-gray-500">
          No {activeTab === 'active' ? 'active' : activeTab === 'completed' ? 'completed' : 'upcoming'} challenges found.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900 flex items-center space-x-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Challenges
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              activeTab === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              activeTab === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              activeTab === 'upcoming'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Upcoming
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredChallenges.map((challenge) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center bg-indigo-100">
                <span className="text-2xl">{challenge.type === 'individual' ? '👤' : challenge.type === 'team' ? '👥' : challenge.type === 'workspace' ? '🏢' : '🌍'}</span>
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start space-x-3">
                  <h4 className="font-medium text-gray-900">{challenge.title}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    challenge.isActive ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {getStatusBadge(challenge).label}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{challenge.description}</p>

                <div className="flex items-center space-x-3 mt-2">
                  <span className="font-medium">Reward:</span>
                  <span className="text-yellow-600">
                    {challenge.rewardPoints} pts
                    {challenge.rewardBadgeId && ' + Badge'}
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
                  <div
                    className={`${getProgressColor(challenge.progress)} h-2.5 rounded-full transition-all duration-500`}
                    style={{ width: `${challenge.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>{challenge.progress}%</span>
                  <span>{challenge.score.toLocaleString()} pts earned</span>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 w-16">
              {challenge.joinedAt ? (
                <button
                  onClick={() => alert('Leave challenge feature coming soon!')}
                  className="mt-2 w-full bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  Leave
                </button>
              ) : challenge.isActive && !challenge.completed ? (
                <button
                  onClick={() => alert('Join challenge feature coming soon!')}
                  className="mt-2 w-full bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
                >
                  Join Challenge
                </button>
              ) : (
                <button
                  className="mt-2 w-full bg-gray-400 text-white px-3 py-2 rounded-lg cursor-not-allowed"
                >
                  {challenge.completed ? 'Completed' : 'Not Active'}
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}