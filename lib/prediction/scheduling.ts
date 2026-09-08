"use client"

import { Task, Priority, TaskStatus } from '@/src/types/index'

export interface ProductivityPattern {
  hour: number
  dayOfWeek: number
  avgCompletionRate: number
  taskCount: number
  avgDuration: number
}

export interface OptimalTimeSlot {
  startTime: string
  endTime: string
  confidence: number
  reason: string
}

export interface SchedulingPrediction {
  optimalSlots: OptimalTimeSlot[]
  energyLevel: 'high' | 'medium' | 'low'
  recommendedDuration: number
  deadlineRisk: 'low' | 'medium' | 'high'
  suggestedBatch: string[]
}

interface UserProductivityData {
  completions: Array<{
    taskId: string
    completedAt: string
    createdAt: string
    duration: number
    priority: Priority
    listId: string
  }>
  userId: string
}

export class PredictiveSchedulingEngine {
  private productivityPatterns: ProductivityPattern[] = []
  private userPatterns: Map<string, ProductivityPattern[]> = new Map()

  async analyzeProductivity(data: UserProductivityData): Promise<ProductivityPattern[]> {
    const patterns: Map<string, ProductivityPattern> = new Map()

    for (const completion of data.completions) {
      const completedAt = new Date(completion.completedAt)
      const hour = completedAt.getHours()
      const dayOfWeek = completedAt.getDay()
      const key = `${dayOfWeek}-${hour}`

      const existing = patterns.get(key)
      if (existing) {
        existing.taskCount++
        existing.avgCompletionRate = (existing.avgCompletionRate * (existing.taskCount - 1) + 1) / existing.taskCount
        existing.avgDuration = (existing.avgDuration * (existing.taskCount - 1) + completion.duration) / existing.taskCount
      } else {
        patterns.set(key, {
          hour,
          dayOfWeek,
          avgCompletionRate: 1,
          taskCount: 1,
          avgDuration: completion.duration
        })
      }
    }

    this.productivityPatterns = Array.from(patterns.values())
    this.userPatterns.set(data.userId, this.productivityPatterns)

    return this.productivityPatterns
  }

  getPeakProductivityHours(userId?: string): number[] {
    const patterns = userId ? this.userPatterns.get(userId) || [] : this.productivityPatterns

    return patterns
      .filter(p => p.taskCount >= 3) // Minimum 3 completions for statistical significance
      .sort((a, b) => b.avgCompletionRate - a.avgCompletionRate)
      .slice(0, 4)
      .map(p => p.hour)
  }

  getBestDaysOfWeek(userId?: string): number[] {
    const patterns = userId ? this.userPatterns.get(userId) || [] : this.productivityPatterns

    const dayStats: Map<number, { totalRate: number; count: number }> = new Map()

    for (const p of patterns) {
      const existing = dayStats.get(p.dayOfWeek)
      if (existing) {
        existing.totalRate += p.avgCompletionRate
        existing.count++
      } else {
        dayStats.set(p.dayOfWeek, { totalRate: p.avgCompletionRate, count: 1 })
      }
    }

    return Array.from(dayStats.entries())
      .filter(([, stats]) => stats.count >= 2)
      .sort((a, b) => (b[1].totalRate / b[1].count) - (a[1].totalRate / a[1].count))
      .map(([day]) => day)
  }

  predictOptimalTime(task: Task, userId?: string): SchedulingPrediction {
    const patterns = userId ? this.userPatterns.get(userId) || [] : this.productivityPatterns
    const peakHours = this.getPeakProductivityHours(userId)
    const bestDays = this.getBestDaysOfWeek(userId)

    // Calculate deadline risk
    const deadlineRisk = this.calculateDeadlineRisk(task)

    // Estimate task duration based on similar tasks
    const estimatedDuration = this.estimateTaskDuration(task, patterns)

    // Find optimal time slots
    const optimalSlots = this.findOptimalSlots(task, peakHours, bestDays, estimatedDuration)

    // Determine energy level for task
    const energyLevel = this.determineEnergyLevel(task, peakHours)

    // Suggest task batching
    const suggestedBatch = this.suggestTaskBatching(task)

    return {
      optimalSlots,
      energyLevel,
      recommendedDuration: estimatedDuration,
      deadlineRisk,
      suggestedBatch
    }
  }

  private calculateDeadlineRisk(task: Task): 'low' | 'medium' | 'high' {
    if (!task.dueDate) return 'low'

    const dueDate = new Date(task.dueDate)
    const now = new Date()
    const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

    if (daysUntilDue < 1) return 'high'
    if (daysUntilDue < 3) return 'medium'
    return 'low'
  }

  private estimateTaskDuration(task: Task, patterns: ProductivityPattern[]): number {
    // Use historical data for similar priority tasks
    const similarPatterns = patterns.filter(p => p.avgDuration > 0)

    if (similarPatterns.length === 0) {
      // Default estimates by priority
      const defaultDurations = {
        [Priority.URGENT]: 120, // 2 hours
        [Priority.HIGH]: 90,    // 1.5 hours
        [Priority.NORMAL]: 60,  // 1 hour
        [Priority.LOW]: 30      // 30 minutes
      }
      return defaultDurations[task.priority] || 60
    }

    // Weight by priority
    const priorityWeight = {
      [Priority.URGENT]: 1.5,
      [Priority.HIGH]: 1.2,
      [Priority.NORMAL]: 1.0,
      [Priority.LOW]: 0.8
    }

    const avgDuration = similarPatterns.reduce((sum, p) => sum + p.avgDuration, 0) / similarPatterns.length
    return Math.round(avgDuration * (priorityWeight[task.priority] || 1.0))
  }

  private findOptimalSlots(
    task: Task,
    peakHours: number[],
    bestDays: number[],
    duration: number
  ): OptimalTimeSlot[] {
    const slots: OptimalTimeSlot[] = []
    const now = new Date()
    const daysToCheck = 14 // Look ahead 2 weeks

    for (let dayOffset = 0; dayOffset < daysToCheck; dayOffset++) {
      const checkDate = new Date(now)
      checkDate.setDate(now.getDate() + dayOffset)
      const dayOfWeek = checkDate.getDay()

      // Check if this is a preferred day
      const dayScore = bestDays.includes(dayOfWeek) ? 1.0 : 0.5

      for (const hour of peakHours) {
        const slotStart = new Date(checkDate)
        slotStart.setHours(hour, 0, 0, 0)

        // Skip past slots
        if (slotStart <= now) continue

        // Check if task would fit before deadline
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate)
          const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000)
          if (slotEnd > dueDate) continue
        }

        const confidence = dayScore * (peakHours.includes(hour) ? 1.0 : 0.7)

        slots.push({
          startTime: slotStart.toISOString(),
          endTime: new Date(slotStart.getTime() + duration * 60 * 1000).toISOString(),
          confidence: Math.min(100, Math.round(confidence * 100)),
          reason: `Peak productivity hour (${hour}:00) on ${this.getDayName(dayOfWeek)}`
        })
      }
    }

    return slots
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
  }

  private determineEnergyLevel(task: Task, peakHours: number[]): 'high' | 'medium' | 'low' {
    // High priority tasks get high energy
    if (task.priority === Priority.URGENT || task.priority === Priority.HIGH) {
      return 'high'
    }

    // Check if task is scheduled during peak hours
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate)
      if (peakHours.includes(dueDate.getHours())) {
        return 'high'
      }
    }

    return 'medium'
  }

  private suggestTaskBatching(task: Task): string[] {
    // Suggest similar tasks to batch together
    const batchSuggestions: string[] = []

    if (task.labels?.length) {
      batchSuggestions.push(`Batch with other ${task.labels[0].name} tasks`)
    }

    if (task.listId) {
      batchSuggestions.push(`Group with ${task.list?.name || 'list'} tasks`)
    }

    // Add context-based suggestions
    if (task.description?.includes('email') || task.description?.includes('message')) {
      batchSuggestions.push('Batch with communication tasks')
    }
    if (task.description?.includes('review') || task.description?.includes('read')) {
      batchSuggestions.push('Batch with review/reading tasks')
    }
    if (task.description?.includes('code') || task.description?.includes('develop')) {
      batchSuggestions.push('Batch with development tasks')
    }

    return batchSuggestions.slice(0, 3)
  }

  private getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[dayOfWeek]
  }

  // Eisenhower Matrix classification
  classifyEisenhower(task: Task): { quadrant: number; label: string } {
    const isUrgent = task.priority === Priority.URGENT ||
                     (task.dueDate && new Date(task.dueDate).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000)

    const isImportant = task.priority === Priority.HIGH || task.priority === Priority.URGENT

    if (isUrgent && isImportant) {
      return { quadrant: 1, label: 'Do First (Urgent & Important)' }
    } else if (!isUrgent && isImportant) {
      return { quadrant: 2, label: 'Schedule (Not Urgent & Important)' }
    } else if (isUrgent && !isImportant) {
      return { quadrant: 3, label: 'Delegate (Urgent & Not Important)' }
    } else {
      return { quadrant: 4, label: 'Eliminate (Not Urgent & Not Important)' }
    }
  }

  // Get Eisenhower matrix for all tasks
  getEisenhowerMatrix(tasks: Task[]): Map<number, Task[]> {
    const matrix = new Map<number, Task[]>()

    for (const task of tasks) {
      const { quadrant } = this.classifyEisenhower(task)
      const existing = matrix.get(quadrant) || []
      existing.push(task)
      matrix.set(quadrant, existing)
    }

    return matrix
  }
}

export const predictiveScheduler = new PredictiveSchedulingEngine()