import { prisma } from '@/lib/prisma'
import { Task, TaskStatus, Priority } from '@/src/types/index'
import { ProductivityPattern } from '@/lib/ai/types'

export interface TimeBlock {
  startTime: Date
  endTime: Date
  taskId: string
  taskTitle: string
  priority: Priority
  type: 'task' | 'break' | 'meeting' | 'focus' | 'buffer'
  energyLevel: 'high' | 'medium' | 'low'
}

export interface DailyPlan {
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

export interface UserSchedulePreferences {
  workStartHour: number // 0-23
  workEndHour: number // 0-23
  preferredBreakDuration: number // minutes
  maxFocusSession: number // minutes
  lunchStartHour: number
  lunchDuration: number
  bufferBetweenTasks: number // minutes
}

const DEFAULT_PREFERENCES: UserSchedulePreferences = {
  workStartHour: 9,
  workEndHour: 17,
  preferredBreakDuration: 15,
  maxFocusSession: 90,
  lunchStartHour: 12,
  lunchDuration: 60,
  bufferBetweenTasks: 10
}

export class DailyPlanner {
  private userId: string
  private preferences: UserSchedulePreferences
  private productivityPatterns: ProductivityPattern[] = []

  constructor(userId: string, preferences?: Partial<UserSchedulePreferences>) {
    this.userId = userId
    this.preferences = { ...DEFAULT_PREFERENCES, ...preferences }
  }

  async generatePlan(date: Date = new Date()): Promise<DailyPlan> {
    // Load user data
    await this.loadUserData()

    // Get tasks for the day
    const tasks = await this.getTasksForDay(date)

    // Calculate energy curve based on productivity patterns
    const energyCurve = this.calculateEnergyCurve(date)

    // Generate time blocks
    const { timeBlocks, unscheduledTasks } = this.scheduleTasks(tasks, date, energyCurve)

    // Add breaks and buffers
    const finalBlocks = this.addBreaksAndBuffers(timeBlocks, date)

    // Calculate totals
    const totalFocusTime = finalBlocks
      .filter(b => b.type === 'task' || b.type === 'focus')
      .reduce((sum, b) => sum + (b.endTime.getTime() - b.startTime.getTime()) / 60000, 0)

    const totalBreakTime = finalBlocks
      .filter(b => b.type === 'break')
      .reduce((sum, b) => sum + (b.endTime.getTime() - b.startTime.getTime()) / 60000, 0)

    const totalMeetingTime = finalBlocks
      .filter(b => b.type === 'meeting')
      .reduce((sum, b) => sum + (b.endTime.getTime() - b.startTime.getTime()) / 60000, 0)

    // Generate recommendations and warnings
    const recommendations = this.generateRecommendations(finalBlocks, tasks, energyCurve)
    const warnings = this.generateWarnings(finalBlocks, tasks, unscheduledTasks)

    return {
      date: date.toISOString().split('T')[0],
      timeBlocks: finalBlocks,
      totalFocusTime: Math.round(totalFocusTime),
      totalBreakTime: Math.round(totalBreakTime),
      totalMeetingTime: Math.round(totalMeetingTime),
      tasksScheduled: finalBlocks.filter(b => b.type === 'task').length,
      tasksUnscheduled: unscheduledTasks,
      energyCurve,
      recommendations,
      warnings
    }
  }

  private async loadUserData(): Promise<void> {
    // Load productivity patterns
    const completedTasks = await prisma.task.findMany({
      where: {
        userId: this.userId,
        status: 'COMPLETED',
        completedAt: { not: null }
      },
      select: {
        id: true,
        priority: true,
        createdAt: true,
        completedAt: true,
        dueDate: true
      }
    })

    this.productivityPatterns = completedTasks.map(task => {
      const created = new Date(task.createdAt)
      const completed = new Date(task.completedAt!)
      const durationMinutes = (completed.getTime() - created.getTime()) / 60000

      return {
        hour: created.getHours(),
        dayOfWeek: created.getDay(),
        avgCompletionRate: 1.0, // All completed tasks are 100% successful
        taskCount: 1,
        avgDuration: Math.round(durationMinutes || 60)
      }
    })
  }

  private async getTasksForDay(date: Date): Promise<Task[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const tasks = await prisma.task.findMany({
      where: {
        userId: this.userId,
        status: { not: 'COMPLETED' },
        OR: [
          { dueDate: { gte: startOfDay, lte: endOfDay } },
          { dueDate: null } // Tasks without due date can be scheduled any day
        ]
      },
      include: { labels: true },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    return tasks as unknown as Task[]
  }

  private calculateEnergyCurve(date: Date): Array<{ hour: number; level: 'high' | 'medium' | 'low' }> {
    const dayOfWeek = date.getDay()
    const curve: Array<{ hour: number; level: 'high' | 'medium' | 'low' }> = []

    for (let hour = 0; hour < 24; hour++) {
      const patterns = this.productivityPatterns.filter(
        p => p.dayOfWeek === dayOfWeek && p.hour === hour
      )

      if (patterns.length >= 3) {
        const avgRate = patterns.reduce((sum, p) => sum + p.avgCompletionRate, 0) / patterns.length
        if (avgRate >= 0.7) curve.push({ hour, level: 'high' })
        else if (avgRate >= 0.4) curve.push({ hour, level: 'medium' })
        else curve.push({ hour, level: 'low' })
      } else {
        // Default energy curve based on circadian rhythms
        if (hour >= 9 && hour <= 11) curve.push({ hour, level: 'high' })
        else if (hour >= 13 && hour <= 15) curve.push({ hour, level: 'medium' })
        else if (hour >= 16 && hour <= 18) curve.push({ hour, level: 'medium' })
        else curve.push({ hour, level: 'low' })
      }
    }

    return curve
  }

  private scheduleTasks(
    tasks: Task[],
    date: Date,
    energyCurve: Array<{ hour: number; level: 'high' | 'medium' | 'low' }>
  ): { timeBlocks: TimeBlock[]; unscheduledTasks: string[] } {
    const timeBlocks: TimeBlock[] = []
    const unscheduledTasks: string[] = []

    let currentTime = new Date(date)
    currentTime.setHours(this.preferences.workStartHour, 0, 0, 0)

    const workEndTime = new Date(date)
    workEndTime.setHours(this.preferences.workEndHour, 0, 0, 0)

    // Schedule lunch break
    const lunchStart = new Date(date)
    lunchStart.setHours(this.preferences.lunchStartHour, 0, 0, 0)
    const lunchEnd = new Date(lunchStart)
    lunchEnd.setMinutes(lunchEnd.getMinutes() + this.preferences.lunchDuration)

    for (const task of tasks) {
      const estimatedDuration = this.estimateTaskDuration(task)
      const taskEndTime = new Date(currentTime)
      taskEndTime.setMinutes(taskEndTime.getMinutes() + estimatedDuration)

      // Check if task fits before work end
      if (taskEndTime > workEndTime) {
        unscheduledTasks.push(task.id)
        continue
      }

      // Handle lunch break
      if (currentTime < lunchEnd && taskEndTime > lunchStart) {
        // Add lunch break first
        timeBlocks.push({
          startTime: new Date(lunchStart),
          endTime: new Date(lunchEnd),
          taskId: 'lunch',
          taskTitle: 'Lunch Break',
          priority: Priority.LOW,
          type: 'break',
          energyLevel: 'low'
        })
        currentTime = new Date(lunchEnd)
        taskEndTime.setMinutes(currentTime.getMinutes() + estimatedDuration)

        if (taskEndTime > workEndTime) {
          unscheduledTasks.push(task.id)
          continue
        }
      }

      // Determine energy level for this time slot
      const hour = currentTime.getHours()
      const energyInfo = energyCurve.find(e => e.hour === hour)
      const energyLevel = energyInfo?.level || 'medium'

      // Adjust duration based on energy level
      let adjustedDuration = estimatedDuration
      if (energyLevel === 'high' && task.priority === Priority.URGENT) {
        adjustedDuration = Math.min(estimatedDuration, this.preferences.maxFocusSession)
      } else if (energyLevel === 'low') {
        adjustedDuration = Math.round(estimatedDuration * 1.3) // Takes longer when tired
      }

      taskEndTime.setMinutes(currentTime.getMinutes() + adjustedDuration)

      // Determine block type
      const blockType = this.getBlockType(task, adjustedDuration)

      timeBlocks.push({
        startTime: new Date(currentTime),
        endTime: new Date(taskEndTime),
        taskId: task.id,
        taskTitle: task.title,
        priority: task.priority,
        type: blockType,
        energyLevel
      })

      // Move current time forward with buffer
      currentTime = new Date(taskEndTime)
      currentTime.setMinutes(currentTime.getMinutes() + this.preferences.bufferBetweenTasks)
    }

    return { timeBlocks, unscheduledTasks }
  }

  private estimateTaskDuration(task: Task): number {
    const baseDurations = {
      [Priority.URGENT]: 45,
      [Priority.HIGH]: 90,
      [Priority.NORMAL]: 60,
      [Priority.LOW]: 30
    }

    let duration = baseDurations[task.priority] || 60

    // Adjust based on description complexity
    const desc = (task.description || '').toLowerCase()
    if (desc.includes('review') || desc.includes('check')) duration *= 0.7
    if (desc.includes('meeting') || desc.includes('call')) duration *= 1.5
    if (desc.includes('report') || desc.includes('document')) duration *= 2
    if (desc.includes('code') || desc.includes('develop')) duration *= 1.8
    if (task.labels?.some(l => l.name.includes('#complex'))) duration *= 1.5
    if (task.subtasks && task.subtasks.length > 0) duration *= (1 + task.subtasks.length * 0.3)

    return Math.round(duration)
  }

  private getBlockType(task: Task, duration: number): 'task' | 'focus' | 'meeting' {
    const desc = (task.description || '').toLowerCase()
    const title = task.title.toLowerCase()

    if (desc.includes('meeting') || title.includes('meeting') || title.includes('call') || title.includes('sync')) {
      return 'meeting'
    }

    if (duration >= this.preferences.maxFocusSession || task.priority === Priority.URGENT) {
      return 'focus'
    }

    return 'task'
  }

  private addBreaksAndBuffers(timeBlocks: TimeBlock[], date: Date): TimeBlock[] {
    if (timeBlocks.length === 0) return timeBlocks

    const finalBlocks: TimeBlock[] = []
    const workEndTime = new Date(date)
    workEndTime.setHours(this.preferences.workEndHour, 0, 0, 0)

    for (let i = 0; i < timeBlocks.length; i++) {
      const block = timeBlocks[i]
      finalBlocks.push(block)

      // Add break after focus sessions or long tasks
      if (i < timeBlocks.length - 1) {
        const nextBlock = timeBlocks[i + 1]
        const timeSinceLastBreak = this.getTimeSinceLastBreak(finalBlocks)

        const shouldAddBreak =
          (block.type === 'focus' || block.type === 'task') &&
          (block.endTime.getTime() - block.startTime.getTime()) / 60000 >= this.preferences.maxFocusSession * 0.8 &&
          timeSinceLastBreak >= this.preferences.maxFocusSession

        if (shouldAddBreak) {
          const breakStart = new Date(block.endTime)
          breakStart.setMinutes(breakStart.getMinutes() + this.preferences.bufferBetweenTasks)
          const breakEnd = new Date(breakStart)
          breakEnd.setMinutes(breakEnd.getMinutes() + this.preferences.preferredBreakDuration)

          if (breakEnd < workEndTime) {
            finalBlocks.push({
              startTime: breakStart,
              endTime: breakEnd,
              taskId: `break_${i}`,
              taskTitle: 'Short Break',
              priority: Priority.LOW,
              type: 'break',
              energyLevel: 'low'
            })
          }
        }
      }
    }

    return finalBlocks
  }

  private getTimeSinceLastBreak(blocks: TimeBlock[]): number {
    for (let i = blocks.length - 1; i >= 0; i--) {
      if (blocks[i].type === 'break') {
        const lastTaskEnd = blocks[i + 1]?.endTime || blocks[blocks.length - 1].endTime
        return (lastTaskEnd.getTime() - blocks[i].endTime.getTime()) / 60000
      }
    }
    // No breaks yet, return time since work start
    const firstBlock = blocks[0]
    if (firstBlock) {
      const workStart = new Date(firstBlock.startTime)
      workStart.setHours(9, 0, 0, 0)
      return (firstBlock.endTime.getTime() - workStart.getTime()) / 60000
    }
    return 0
  }

  private generateRecommendations(
    blocks: TimeBlock[],
    tasks: Task[],
    energyCurve: Array<{ hour: number; level: 'high' | 'medium' | 'low' }>
  ): string[] {
    const recommendations: string[] = []

    const focusBlocks = blocks.filter(b => b.type === 'focus' || b.type === 'task')
    const totalFocusMinutes = focusBlocks.reduce((sum, b) => sum + (b.endTime.getTime() - b.startTime.getTime()) / 60000, 0)

    if (totalFocusMinutes < 120) {
      recommendations.push('Consider adding more deep work time - aim for at least 2 hours of focused work daily')
    }

    const highEnergyHours = energyCurve.filter(e => e.level === 'high').map(e => e.hour)
    const tasksInHighEnergy = focusBlocks.filter(b => highEnergyHours.includes(b.startTime.getHours())).length

    if (tasksInHighEnergy < focusBlocks.length * 0.5) {
      recommendations.push('Try scheduling your most important tasks during your peak energy hours (typically 9-11 AM)')
    }

    const urgentTasks = tasks.filter(t => t.priority === Priority.URGENT).length
    if (urgentTasks > 3) {
      recommendations.push(`You have ${urgentTasks} urgent tasks - consider delegating or deferring some`)
    }

    const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED').length
    if (overdueTasks > 0) {
      recommendations.push(`${overdueTasks} overdue tasks need immediate attention`)
    }

    if (recommendations.length === 0) {
      recommendations.push('Your schedule looks well-balanced today!')
    }

    return recommendations
  }

  private generateWarnings(
    blocks: TimeBlock[],
    tasks: Task[],
    unscheduledTasks: string[]
  ): string[] {
    const warnings: string[] = []

    if (unscheduledTasks.length > 0) {
      warnings.push(`${unscheduledTasks.length} tasks couldn't fit in today's schedule`)
    }

    const totalWorkMinutes = blocks
      .filter(b => b.type !== 'break')
      .reduce((sum, b) => sum + (b.endTime.getTime() - b.startTime.getTime()) / 60000, 0)

    if (totalWorkMinutes > 480) { // > 8 hours
      warnings.push('Workday exceeds 8 hours - risk of burnout')
    }

    const backToBackFocus = this.checkBackToBackFocus(blocks)
    if (backToBackFocus) {
      warnings.push('Multiple focus sessions back-to-back without adequate breaks')
    }

    const lateWork = blocks.some(b => b.endTime.getHours() >= 18 && b.type !== 'break')
    if (lateWork) {
      warnings.push('Work scheduled past 6 PM - consider wrapping up earlier')
    }

    return warnings
  }

  private checkBackToBackFocus(blocks: TimeBlock[]): boolean {
    let consecutiveFocus = 0
    for (const block of blocks) {
      if (block.type === 'focus' || block.type === 'task') {
        consecutiveFocus++
        if (consecutiveFocus >= 3) return true
      } else {
        consecutiveFocus = 0
      }
    }
    return false
  }

  // Static method to get user's saved preferences
  static async getUserPreferences(userId: string): Promise<UserSchedulePreferences> {
    const userSetting = await prisma.userSetting.findUnique({
      where: { userId },
      select: { integrations: true }
    })

    const calendarSettings = (userSetting?.integrations as any)?.dailyPlanner || {}
    return { ...DEFAULT_PREFERENCES, ...calendarSettings }
  }

  // Static method to save user preferences
  static async saveUserPreferences(userId: string, preferences: Partial<UserSchedulePreferences>): Promise<void> {
    await prisma.userSetting.upsert({
      where: { userId },
      update: {
        integrations: {
          dailyPlanner: preferences
        } as any
      },
      create: {
        userId,
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        notifications: true,
        emailNotifications: true,
        desktopNotifications: true,
        soundNotifications: false,
        calendarSync: {} as any,
        integrations: {
          dailyPlanner: preferences
        } as any
      }
    })
  }
}