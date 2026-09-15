// Achievement Types
export type AchievementCategory =
  | 'PRODUCTIVITY'
  | 'COLLABORATION'
  | 'LEARNING'
  | 'STREAK'
  | 'SOCIAL'
  | 'CUSTOMIZATION'

export type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'

export type LeaderboardType =
  | 'POINTS'
  | 'LEVEL'
  | 'STREAK'
  | 'TASKS_COMPLETED'
  | 'CHALLENGES_WON'

export type LeaderboardPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME'

export type ChallengeType =
  | 'INDIVIDUAL'
  | 'TEAM'
  | 'WORKSPACE'
  | 'GLOBAL'

export interface Achievement {
  id: string
  name: string
  description?: string
  icon: string
  category: AchievementCategory
  points: number
  rarity: Rarity
  criteria: AchievementCriteria
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AchievementCriteria {
  type: 'task_completion' | 'streak' | 'points' | 'subtasks' | 'labels' | 'projects'
  threshold: number
  operator: '>=' | '>' | '==' | '<' | '<='
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time'
}

export interface UserAchievement {
  id: string
  userId: string
  achievementId: string
  unlockedAt: string
  progress: number
  achievement?: Achievement
}

export interface UserPoints {
  id: string
  userId: string
  totalPoints: number
  level: number
  currentLevelXp: number
  levelXpRequired: number
  lastUpdated: string
}

export interface SkillTreeNode {
  id: string
  skillTreeId: string
  name: string
  description?: string
  icon: string
  xpValue: number
  prerequisites: string[]
  isUnlocked: boolean
  isCompleted: boolean
  completedAt?: string
  positionX: number
  positionY: number
}

export interface SkillTree {
  id: string
  userId: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  nodes: SkillTreeNode[]
}

export interface Challenge {
  id: string
  title: string
  description: string | null
  type: ChallengeType
  startDate: string
  endDate: string
  rewardPoints: number
  rewardBadgeId?: string
  maxParticipants?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ChallengeParticipant {
  id: string
  challengeId: string
  userId: string
  joinedAt: string
  progress: number
  score: number
  completed: boolean
  completedAt?: string
  challenge?: Challenge
}

export interface LeaderboardEntry {
  id: string
  leaderboardId: string
  userId: string
  rank: number
  score: number
  previousRank?: number
  updatedAt: string
  user?: {
    id: string
    name?: string
    image?: string
  }
}

export interface GamificationState {
  streak: StreakInfo
  points: UserPoints
  achievements: UserAchievement[]
  level: UserLevel
  leaderboard: LeaderboardEntry[]
  challenges: ChallengeParticipant[]
  skillTree: SkillTree
}

export interface StreakInfo {
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
  totalTasksCompleted: number
  dailyGoal: number
  dailyGoalProgress: number
  badges: string[]
}

export interface UserLevel {
  level: number
  xp: number
  xpToNextLevel: number
}

export interface Reward {
  id: string
  type: 'badge' | 'points' | 'level_boost' | 'item' | 'feature_unlock'
  value: any
  description: string
  isClaimed: boolean
}

export interface PointsTransaction {
  id: string
  userId: string
  amount: number
  type: 'task_completed' | 'achievement_unlocked' | 'challenge_won' | 'daily_streak' | 'bonus'
  referenceId?: string
  description: string
  createdAt: string
}