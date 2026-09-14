import { prisma } from '@/lib/prisma'
import { type User } from '@/src/types/index'

interface StreakInfo {
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
  totalTasksCompleted: number
  dailyGoal: number
  dailyGoalProgress: number
  badges: string[]
  points: UserPoints
  achievements: UserAchievement[]
  level: UserLevel
}

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt: Date
}

interface UserPoints {
  totalPoints: number
  level: number
  currentLevelXp: number
  levelXpRequired: number
}

interface UserLevel {
  level: number
  xp: number
  xpToNextLevel: number
}

interface UserAchievement {
  id: string
  name: string
  description?: string
  icon: string
  category: string
  points: number
  rarity: string
  isUnlocked: boolean
  progress: number
}

/**
 * Calculate XP required for a given level
 */
const calculateXpRequired = (level: number): number => {
  return Math.round(100 * Math.pow(1.5, level - 1))
}

export async function getUserGamification(userId: string): Promise<StreakInfo> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const lastWeek = new Date(today)
  lastWeek.setDate(lastWeek.getDate() - 7)

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: 'COMPLETED',
      completedAt: { gte: lastWeek },
    },
    select: {
      id: true,
      completedAt: true,
      createdAt: true,
    },
    orderBy: { completedAt: 'desc' },
  })

  const completedToday = tasks.filter(t => {
    const completed = new Date(t.completedAt!)
    return completed >= today
  }).length

  const completedYesterday = tasks.filter(t => {
    const completed = new Date(t.completedAt!)
    return completed >= yesterday && completed < today
  }).length

  let currentStreak = 0
  if (completedToday > 0) {
    currentStreak = 1
    if (completedYesterday > 0) {
      currentStreak = 2
      let checkDate = new Date(yesterday)
      while (true) {
        const prevDate = new Date(checkDate)
        prevDate.setDate(prevDate.getDate() - 1)
        const prevDayTasks = tasks.filter(t => {
          const completed = new Date(t.completedAt!)
          return completed >= prevDate && completed < checkDate
        })
        if (prevDayTasks.length > 0) {
          currentStreak++
          checkDate = prevDate
        } else {
          break
        }
      }
    }
  }

  let longestStreak = 0
  let tempStreak = 0
  let lastDate: Date | null = null
  for (const task of tasks) {
    const taskDate = new Date(task.completedAt!)
    taskDate.setHours(0, 0, 0, 0)
    if (!lastDate || (taskDate.getTime() === lastDate.getTime() + 86400000)) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else if (taskDate.getTime() !== lastDate.getTime()) {
      tempStreak = 1
    }
    lastDate = taskDate
  }

  const todayTaskCount = tasks.filter(t => {
    const completed = new Date(t.completedAt!)
    return completed >= today
  }).length

  const badges: Badge[] = []

  if (currentStreak >= 3) {
    badges.push({
      id: 'streak_3',
      name: 'Getting Started',
      description: '3-day streak',
      icon: '🔥',
      unlockedAt: new Date(),
    })
  }

  if (currentStreak >= 7) {
    badges.push({
      id: 'streak_7',
      name: 'Weekly Warrior',
      description: '7-day streak',
      icon: '⭐',
      unlockedAt: new Date(),
    })
  }

  if (currentStreak >= 30) {
    badges.push({
      id: 'streak_30',
      name: 'Monthly Master',
      description: '30-day streak',
      icon: '🏆',
      unlockedAt: new Date(),
    })
  }

  const totalCompleted = tasks.length

  // Calculate points based on tasks completed
  const totalPoints = totalCompleted * 10 // 10 points per task
  let currentLevel = 1
  let xpInCurrentLevel = 0
  let levelXpRequired = 100

  // Calculate level from total points
  let tempXp = totalPoints
  let level = 1
  while (tempXp >= calculateXpRequired(level)) {
    tempXp -= calculateXpRequired(level)
    level++
  }
  currentLevel = level
  xpInCurrentLevel = tempXp
  levelXpRequired = calculateXpRequired(level)

  // Get achievements (mock for now - will be replaced with DB)
  const achievements: UserAchievement[] = [
    {
      id: 'first_task',
      name: 'First Steps',
      description: 'Complete your first task',
      icon: '👶',
      category: 'PRODUCTIVITY',
      points: 10,
      rarity: 'COMMON',
      isUnlocked: totalCompleted >= 1,
      progress: totalCompleted >= 1 ? 100 : totalCompleted * 100,
    },
    {
      id: 'task_master',
      name: 'Task Master',
      description: 'Complete 50 tasks',
      icon: '⚡',
      category: 'PRODUCTIVITY',
      points: 50,
      rarity: 'UNCOMMON',
      isUnlocked: totalCompleted >= 50,
      progress: totalCompleted >= 50 ? 100 : (totalCompleted / 50) * 100,
    },
    {
      id: 'streak_starter',
      name: 'Streak Starter',
      description: '3-day streak',
      icon: '🔥',
      category: 'STREAK',
      points: 25,
      rarity: 'COMMON',
      isUnlocked: currentStreak >= 3,
      progress: currentStreak >= 3 ? 100 : (currentStreak / 3) * 100,
    },
    {
      id: 'weekly_warrior',
      name: 'Weekly Warrior',
      description: '7-day streak',
      icon: '⭐',
      category: 'STREAK',
      points: 50,
      rarity: 'UNCOMMON',
      isUnlocked: currentStreak >= 7,
      progress: currentStreak >= 7 ? 100 : (currentStreak / 7) * 100,
    },
    {
      id: 'monthly_master',
      name: 'Monthly Master',
      description: '30-day streak',
      icon: '🏆',
      category: 'STREAK',
      points: 100,
      rarity: 'RARE',
      isUnlocked: currentStreak >= 30,
      progress: currentStreak >= 30 ? 100 : (currentStreak / 30) * 100,
    },
    {
      id: 'century_club',
      name: 'Century Club',
      description: 'Complete 100 tasks',
      icon: '💯',
      category: 'PRODUCTIVITY',
      points: 100,
      rarity: 'EPIC',
      isUnlocked: totalCompleted >= 100,
      progress: totalCompleted >= 100 ? 100 : (totalCompleted / 100) * 100,
    },
  ]

  const points: UserPoints = {
    totalPoints,
    level: currentLevel,
    currentLevelXp: xpInCurrentLevel,
    levelXpRequired,
  }

  const levelData: UserLevel = {
    level: currentLevel,
    xp: xpInCurrentLevel,
    xpToNextLevel: levelXpRequired,
  }

  return {
    currentStreak,
    longestStreak,
    lastActiveDate: tasks[0]?.completedAt?.toISOString() || null,
    totalTasksCompleted: totalCompleted,
    dailyGoal: 5,
    dailyGoalProgress: todayTaskCount,
    badges: badges.map(b => b.name),
    points,
    achievements,
    level: levelData,
  }
}

export async function checkAndAwardBadges(userId: string): Promise<Badge[]> {
  const gamification = await getUserGamification(userId)
  const newBadges: Badge[] = []

  if (gamification.currentStreak >= 3 && !gamification.badges.includes('Getting Started')) {
    newBadges.push({
      id: 'streak_3',
      name: 'Getting Started',
      description: '3-day streak',
      icon: '🔥',
      unlockedAt: new Date(),
    })
  }

  if (gamification.currentStreak >= 7 && !gamification.badges.includes('Weekly Warrior')) {
    newBadges.push({
      id: 'streak_7',
      name: 'Weekly Warrior',
      description: '7-day streak',
      icon: '⭐',
      unlockedAt: new Date(),
    })
  }

  if (gamification.currentStreak >= 30 && !gamification.badges.includes('Monthly Master')) {
    newBadges.push({
      id: 'streak_30',
      name: 'Monthly Master',
      description: '30-day streak',
      icon: '🏆',
      unlockedAt: new Date(),
    })
  }

  return newBadges
}