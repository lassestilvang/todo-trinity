import { prisma } from '@/lib/prisma'
import { Task, Priority, TaskStatus } from '@/src/types/index'

export interface TimeBlock {
  startTime: Date
  endTime: Date
  taskId: string
  taskTitle: string
  priority: Priority
}

export interface Conflict {
  id: string
  type: 'time_overlap' | 'deadline_conflict' | 'dependency_conflict' | 'resource_conflict' | 'workload_conflict'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  affectedTasks: string[]
  suggestedResolution: string
  resolutions: ConflictResolution[]
  detectedAt: Date
}

export interface ConflictResolution {
  id: string
  type: 'reschedule' | 'reassign' | 'split' | 'deprioritize' | 'delegate' | 'extend_deadline'
  title: string
  description: string
  affectedTaskId: string
  newStartTime?: Date
  newEndTime?: Date
  newPriority?: Priority
  estimatedImpact: 'low' | 'medium' | 'high'
}

export interface ConflictAnalysis {
  conflicts: Conflict[]
  summary: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
  }
  timeBlocks: TimeBlock[]
  generatedAt: Date
}

export class ConflictDetector {
  async detectConflicts(userId: string): Promise<ConflictAnalysis> {
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        status: { not: 'COMPLETED' }
      },
      include: { labels: true }
    })

    const timeBlocks = this.buildTimeBlocks(tasks)
    const conflicts: Conflict[] = []

    // 1. Time overlap conflicts
    conflicts.push(...this.detectTimeOverlaps(timeBlocks))

    // 2. Deadline conflicts
    conflicts.push(...this.detectDeadlineConflicts(tasks))

    // 3. Dependency conflicts
    conflicts.push(...this.detectDependencyConflicts(tasks))

    // 4. Workload conflicts
    conflicts.push(...this.detectWorkloadConflicts(tasks, timeBlocks))

    // 5. Resource/label conflicts
    conflicts.push(...this.detectResourceConflicts(tasks))

    return {
      conflicts: conflicts.sort((a, b) => this.severityOrder(b.severity) - this.severityOrder(a.severity)),
      summary: {
        total: conflicts.length,
        critical: conflicts.filter(c => c.severity === 'critical').length,
        high: conflicts.filter(c => c.severity === 'high').length,
        medium: conflicts.filter(c => c.severity === 'medium').length,
        low: conflicts.filter(c => c.severity === 'low').length
      },
      timeBlocks,
      generatedAt: new Date()
    }
  }

  private buildTimeBlocks(tasks: Task[]): TimeBlock[] {
    const blocks: TimeBlock[] = []

    for (const task of tasks) {
      if (!task.dueDate) continue

      const dueDate = new Date(task.dueDate)
      const estimatedDuration = this.estimateTaskDuration(task)

      // Assume tasks are worked on during business hours
      const startTime = new Date(dueDate)
      startTime.setHours(9, 0, 0, 0)

      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + estimatedDuration)

      blocks.push({
        startTime,
        endTime,
        taskId: task.id,
        taskTitle: task.title,
        priority: task.priority
      })
    }

    return blocks
  }

  private estimateTaskDuration(task: Task): number {
    const baseDurations = {
      [Priority.URGENT]: 60,
      [Priority.HIGH]: 90,
      [Priority.NORMAL]: 120,
      [Priority.LOW]: 60
    }
    return baseDurations[task.priority] || 120
  }

  private detectTimeOverlaps(timeBlocks: TimeBlock[]): Conflict[] {
    const conflicts: Conflict[] = []

    for (let i = 0; i < timeBlocks.length; i++) {
      for (let j = i + 1; j < timeBlocks.length; j++) {
        const blockA = timeBlocks[i]
        const blockB = timeBlocks[j]

        // Check for overlap
        if (this.overlaps(blockA.startTime, blockA.endTime, blockB.startTime, blockB.endTime)) {
          const overlapMinutes = this.calculateOverlapMinutes(blockA, blockB)

          conflicts.push({
            id: crypto.randomUUID(),
            type: 'time_overlap',
            severity: overlapMinutes > 60 ? 'high' : 'medium',
            title: 'Overlapping time blocks',
            description: `"${blockA.taskTitle}" and "${blockB.taskTitle}" have overlapping scheduled time (${overlapMinutes} minutes overlap)`,
            affectedTasks: [blockA.taskId, blockB.taskId],
            suggestedResolution: `Reschedule one task to a different time slot`,
            resolutions: [
              {
                id: crypto.randomUUID(),
                type: 'reschedule',
                title: `Move "${blockB.taskTitle}" later`,
                description: `Shift the lower priority task to start after "${blockA.taskTitle}" completes`,
                affectedTaskId: blockB.taskId,
                newStartTime: blockA.endTime,
                newEndTime: new Date(blockA.endTime.getTime() + this.estimateMinutes(blockB.priority)),
                estimatedImpact: 'low'
              },
              {
                id: crypto.randomUUID(),
                type: 'reschedule',
                title: `Move "${blockA.taskTitle}" earlier`,
                description: `Start the higher priority task earlier to make room`,
                affectedTaskId: blockA.taskId,
                newStartTime: new Date(blockB.startTime.getTime() - this.estimateMinutes(blockA.priority)),
                newEndTime: blockB.startTime,
                estimatedImpact: 'medium'
              }
            ],
            detectedAt: new Date()
          })
        }
      }
    }

    return conflicts
  }

  private overlaps(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
    return startA < endB && startB < endA
  }

  private calculateOverlapMinutes(blockA: TimeBlock, blockB: TimeBlock): number {
    const overlapStart = blockA.startTime > blockB.startTime ? blockA.startTime : blockB.startTime
    const overlapEnd = blockA.endTime < blockB.endTime ? blockA.endTime : blockB.endTime
    return Math.max(0, (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60))
  }

  private estimateMinutes(priority: Priority): number {
    const durations = { [Priority.URGENT]: 60, [Priority.HIGH]: 90, [Priority.NORMAL]: 120, [Priority.LOW]: 60 }
    return durations[priority] || 120
  }

  private detectDeadlineConflicts(tasks: Task[]): Conflict[] {
    const conflicts: Conflict[] = []
    const now = new Date()

    // Group tasks by deadline day
    const deadlineGroups = new Map<string, Task[]>()

    for (const task of tasks) {
      if (!task.dueDate) continue

      const dueDate = new Date(task.dueDate)
      const dayKey = dueDate.toISOString().split('T')[0]

      if (!deadlineGroups.has(dayKey)) {
        deadlineGroups.set(dayKey, [])
      }
      deadlineGroups.get(dayKey)!.push(task)
    }

    // Check each day for too many high-priority tasks
    for (const [day, dayTasks] of deadlineGroups) {
      const highPriorityCount = dayTasks.filter(t => t.priority === Priority.URGENT || t.priority === Priority.HIGH).length
      const totalEstimatedHours = dayTasks.reduce((sum, t) => sum + this.estimateTaskDuration(t) / 60, 0)

      if (highPriorityCount > 3) {
        conflicts.push({
          id: crypto.randomUUID(),
          type: 'deadline_conflict',
          severity: 'high',
          title: `Too many high-priority tasks due on ${day}`,
          description: `${highPriorityCount} urgent/high priority tasks due same day, ${dayTasks.length} total tasks (${totalEstimatedHours.toFixed(1)}h estimated)`,
          affectedTasks: dayTasks.map(t => t.id),
          suggestedResolution: 'Reschedule some tasks to different days or reduce scope',
          resolutions: dayTasks
            .filter(t => t.priority !== Priority.URGENT)
            .slice(0, 2)
            .map(task => ({
              id: crypto.randomUUID(),
              type: 'reschedule',
              title: `Reschedule "${task.title}"`,
              description: `Move to a less busy day`,
              affectedTaskId: task.id,
              newStartTime: this.findAlternativeDay(task, dayTasks),
              estimatedImpact: 'medium'
            })),
          detectedAt: new Date()
        })
      }

      if (totalEstimatedHours > 10) {
        conflicts.push({
          id: crypto.randomUUID(),
          type: 'deadline_conflict',
          severity: 'medium',
          title: `Overloaded day: ${day}`,
          description: `${totalEstimatedHours.toFixed(1)} hours of work scheduled in one day`,
          affectedTasks: dayTasks.map(t => t.id),
          suggestedResolution: 'Distribute tasks across multiple days',
          resolutions: dayTasks.slice(0, 2).map(task => ({
            id: crypto.randomUUID(),
            type: 'reschedule',
            title: `Move "${task.title}" to another day`,
            affectedTaskId: task.id,
            newStartTime: this.findAlternativeDay(task, dayTasks),
            estimatedImpact: 'low'
          })),
          detectedAt: new Date()
        })
      }
    }

    return conflicts
  }

  private findAlternativeDay(task: Task, excludeTasks: Task[]): Date {
    const now = new Date()
    for (let i = 1; i <= 14; i++) {
      const candidate = new Date(now)
      candidate.setDate(now.getDate() + i)
      candidate.setHours(9, 0, 0, 0)

      // Check if this day has capacity
      const dayKey = candidate.toISOString().split('T')[0]
      const dayTasks = excludeTasks.filter(t => {
        if (!t.dueDate) return false
        return new Date(t.dueDate).toISOString().split('T')[0] === dayKey
      })

      if (dayTasks.length < 5) return candidate
    }
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  }

  private detectDependencyConflicts(tasks: Task[]): Conflict[] {
    // Simplified - check if tasks mention dependencies in description
    const conflicts: Conflict[] = []

    for (const task of tasks) {
      const description = (task.description || '').toLowerCase()
      if (description.includes('depends on') || description.includes('after') || description.includes('blocked by')) {
        // Find potential dependency tasks
        const potentialDeps = tasks.filter(t =>
          t.id !== task.id &&
          description.includes(t.title.toLowerCase().substring(0, 20))
        )

        if (potentialDeps.length > 0) {
          conflicts.push({
            id: crypto.randomUUID(),
            type: 'dependency_conflict',
            severity: 'medium',
            title: `Potential dependency for "${task.title}"`,
            description: `Task description suggests it depends on other tasks that may not be completed`,
            affectedTasks: [task.id, ...potentialDeps.map(t => t.id)],
            suggestedResolution: 'Verify dependency order and schedule accordingly',
            resolutions: potentialDeps.map(dep => ({
              id: crypto.randomUUID(),
              type: 'reschedule',
              title: `Schedule "${dep.title}" before "${task.title}"`,
              affectedTaskId: dep.id,
              newStartTime: new Date(),
              estimatedImpact: 'medium'
            })),
            detectedAt: new Date()
          })
        }
      }
    }

    return conflicts
  }

  private detectWorkloadConflicts(tasks: Task[], timeBlocks: TimeBlock[]): Conflict[] {
    const conflicts: Conflict[] = []
    const now = new Date()

    // Check next 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const dayStart = new Date(now)
      dayStart.setDate(now.getDate() + dayOffset)
      dayStart.setHours(0, 0, 0, 0)

      const dayEnd = new Date(dayStart)
      dayEnd.setHours(23, 59, 59, 999)

      const dayBlocks = timeBlocks.filter(b => b.startTime >= dayStart && b.startTime <= dayEnd)
      const totalHours = dayBlocks.reduce((sum, b) => sum + (b.endTime.getTime() - b.startTime.getTime()) / (1000 * 60 * 60), 0)

      if (totalHours > 8) {
        conflicts.push({
          id: crypto.randomUUID(),
          type: 'workload_conflict',
          severity: totalHours > 12 ? 'high' : 'medium',
          title: `Overloaded day: ${dayStart.toLocaleDateString()}`,
          description: `${totalHours.toFixed(1)} hours of work scheduled (exceeds 8h workday)`,
          affectedTasks: dayBlocks.map(b => b.taskId),
          suggestedResolution: 'Reschedule lower priority tasks to other days',
          resolutions: dayBlocks
            .sort((a, b) => this.priorityWeight(b.priority) - this.priorityWeight(a.priority))
            .slice(0, 2)
            .map(block => ({
              id: crypto.randomUUID(),
              type: 'reschedule',
              title: `Move "${block.taskTitle}"`,
              affectedTaskId: block.taskId,
              newStartTime: this.findNextAvailableSlot(dayEnd),
              estimatedImpact: 'low'
            })),
          detectedAt: new Date()
        })
      }
    }

    return conflicts
  }

  private findNextAvailableSlot(after: Date): Date {
    const nextDay = new Date(after)
    nextDay.setDate(after.getDate() + 1)
    nextDay.setHours(9, 0, 0, 0)
    return nextDay
  }

  private detectResourceConflicts(tasks: Task[]): Conflict[] {
    const conflicts: Conflict[] = []
    const labelUsage = new Map<string, Task[]>()

    for (const task of tasks) {
      for (const label of task.labels || []) {
        if (!labelUsage.has(label.name)) {
          labelUsage.set(label.name, [])
        }
        labelUsage.get(label.name)!.push(task)
      }
    }

    // Check for context switching
    for (const [label, labelTasks] of labelUsage) {
      if (labelTasks.length > 5) {
        conflicts.push({
          id: crypto.randomUUID(),
          type: 'resource_conflict',
          severity: 'low',
          title: `Frequent context switching: ${label}`,
          description: `${labelTasks.length} tasks with label "${label}" - consider batching similar tasks`,
          affectedTasks: labelTasks.map(t => t.id),
          suggestedResolution: 'Group similar tasks together in your schedule',
          resolutions: [{
            id: crypto.randomUUID(),
            type: 'reschedule',
            title: `Batch "${label}" tasks`,
            description: `Schedule all "${label}" tasks consecutively`,
            affectedTaskId: labelTasks[0].id,
            estimatedImpact: 'low'
          }],
          detectedAt: new Date()
        })
      }
    }

    return conflicts
  }

  private severityOrder(severity: string): number {
    const order = { critical: 4, high: 3, medium: 2, low: 1 }
    return order[severity as keyof typeof order] || 0
  }

  private priorityWeight(priority: Priority): number {
    const weights = { [Priority.URGENT]: 4, [Priority.HIGH]: 3, [Priority.NORMAL]: 2, [Priority.LOW]: 1 }
    return weights[priority] || 0
  }
}

export const conflictDetector = new ConflictDetector()