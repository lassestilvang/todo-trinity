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
}

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt: Date
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

  return {
    currentStreak,
    longestStreak,
    lastActiveDate: tasks[0]?.completedAt?.toISOString() || null,
    totalTasksCompleted: totalCompleted,
    dailyGoal: 5,
    dailyGoalProgress: todayTaskCount,
    badges: badges.map(b => b.name),
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