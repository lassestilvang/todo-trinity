import { prisma } from '@/lib/prisma'
import { Task, Priority, TaskStatus } from '@/src/types/index'
import { PriorityInsight, PriorityRecommendation, SmartPriorityResult, ProductivityPattern, PriorityContext, WorkloadInfo, DeadlineInfo } from '@/lib/ai/types'

export class SmartPriorityEngine {
  private productivityPatterns: ProductivityPattern[] = []

  async analyzeAndRecommend(userId: string): Promise<SmartPriorityResult> {
    const tasks = await prisma.task.findMany({
      where: { userId },
      include: { labels: true }
    })

    const completed = await prisma.task.findMany({
      where: { userId, status: 'COMPLETED' },
      select: { id: true, completedAt: true, priority: true, dueDate: true }
    })

    const workload = this.analyzeWorkload(tasks)
    const patterns = this.analyzeProductivityPatterns(completed)
    this.productivityPatterns = patterns

    const recommendations = tasks.map(task => this.generateRecommendation(task, workload, patterns))

    return {
      recommendations,
      updatedAt: new Date().toISOString(),
      generatedBy: 'ai'
    }
  }

  private analyzeWorkload(tasks: Task[]): WorkloadInfo {
    const totalTasks = tasks.length
    const activeTasks = tasks.filter(t => t.status !== 'COMPLETED').length
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const completedToday = tasks.filter(t => {
      if (!t.completedAt) return false
      return new Date(t.completedAt).setHours(0, 0, 0, 0) >= today.setHours(0, 0, 0, 0)
    }).length

    const overdueTasks = tasks.filter(t => {
      if (t.status === 'COMPLETED' || t.dueDate === null) return false
      return new Date(t.dueDate) < new Date()
    }).length

    return { totalTasks, activeTasks, completedToday, overdueTasks }
  }

  private analyzeProductivityPatterns(completed: { id: string; completedAt: string; priority: Priority; dueDate: string | null }[]): ProductivityPattern[] {
    const patterns: Map<string, ProductivityPattern> = new Map()

    for (const completion of completed) {
      const completedAt = new Date(completion.completedAt)
      const hour = completedAt.getHours()
      const dayOfWeek = completedAt.getDay()
      const key = `${dayOfWeek}-${hour}`

      const existing = patterns.get(key)
      if (existing) {
        existing.taskCount++
        existing.avgCompletionRate = (existing.avgCompletionRate * (existing.taskCount - 1) + 1) / existing.taskCount
        existing.avgDuration = (existing.avgDuration * (existing.taskCount - 1) + this.estimateDuration(completion)) / existing.taskCount
      } else {
        patterns.set(key, {
          hour,
          dayOfWeek,
          avgCompletionRate: 1,
          taskCount: 1,
          avgDuration: this.estimateDuration(completion as any)
        })
      }
    }

    return Array.from(patterns.values())
  }

  private estimateDuration(completion: any): number {
    // Simple estimate based on priority
    const defaultDurations = {
      [Priority.URGENT]: 120,
      [Priority.HIGH]: 90,
      [Priority.NORMAL]: 60,
      [Priority.LOW]: 30
    }
    return (defaultDurations[completion.priority] || 60)
  }

  private generateRecommendation(
    task: Task,
    workload: WorkloadInfo,
    patterns: ProductivityPattern[]
  ): PriorityRecommendation {
    let suggestedPriority = task.priority
    let confidence = 50
    const reasons: string[] = []

    // 1. Deadline risk analysis
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate)
      const now = new Date()
      const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

      if (daysUntilDue < 1) {
        reasons.push('Due tomorrow - prioritizing to URGENT')
        suggestedPriority = Priority.URGENT
        confidence = 90
      } else if (daysUntilDue < 3) {
        if (suggestedPriority !== Priority.URGENT) {
          reasons.push('Due within 3 days - consider HIGH')
          if (suggestedPriority !== Priority.URGENT && suggestedPriority !== Priority.HIGH) {
            suggestedPriority = Priority.HIGH
            confidence = 75
          }
        }
      } else if (daysUntilDue < 7) {
        if (suggestedPriority.length < 2) {
          reasons.push('Due within a week - consider priority adjustment')
          if (suggestedPriority === Priority.LOW) {
            suggestedPriority = Priority.NORMAL
            confidence = 65
          }
        }
      }
    }

    // 2. Workload analysis
    if (workload.overdueTasks > 0 && task.status !== 'COMPLETED') {
      reasons.push(`You have ${workload.overdueTasks} overdue tasks - consider priority increase`)
      if (suggestedPriority !== Priority.URGENT && suggestedPriority !== Priority.HIGH) {
        suggestedPriority = Priority.HIGH
        confidence = Math.max(confidence, 70)
      }
    }

    // 3. Productivity pattern analysis
    const peakHours = patterns
      .filter(p => p.taskCount >= 3)
      .sort((a, b) => b.avgCompletionRate - a.avgCompletionRate)
      .slice(0, 3)
      .map(p => p.hour)

    const taskHour = new Date().getHours()
    const isPeakHour = peakHours.includes(taskHour)

    if (isPeakHour && suggestedPriority === Priority.NORMAL) {
      reasons.push('Current time is your peak productivity hour')
      if (Math.random() > 0.5) {
        suggestedPriority = Priority.HIGH
        confidence = Math.max(confidence, 60)
      }
    }

    // 4. Dependency analysis (simplified)
    if (task.description?.includes('depends') || task.title?.includes('depends')) {
      reasons.push('Task has dependency chains - prioritize to ensure flow')
      if (suggestedPriority === Priority.LOW) {
        suggestedPriority = Priority.NORMAL
        confidence = Math.max(confidence, 55)
      }
    }

    // 5. Label-based prioritization
    if (task.labels?.length > 0) {
      const importantLabels = task.labels.filter(l => l.name.includes('#important') || l.name.includes('#urgent'))
      if (importantLabels.length > 0 && suggestedPriority === Priority.NORMAL) {
        reasons.push(`Task has important label(s): ${importantLabels.map(l => l.name).join(', ')}`)
        suggestedPriority = Priority.HIGH
        confidence = 70
      }
    }

    // Default boost for tasks without clear priority
    if (suggestedPriority === Priority.NORMAL && reasons.length === 0 && workload.activeTasks > 5) {
      // Slight nudge based on overall workload
      reasons.push('High task volume - consider reviewing priorities')
    }

    const alternativePriorities = this.getAlternatives(suggestedPriority)

    return {
      taskId: task.id,
      suggestedPriority,
      confidence: Math.min(100, Math.max(0, confidence)),
      reason: reasons.join('. '),
      alternativePriorities
    }
  }

  private getAlternatives(current: Priority): Priority[] {
    const order: Priority[] = [Priority.URGENT, Priority.HIGH, Priority.NORMAL, Priority.LOW]
    const idx = order.indexOf(current)
    const alternatives: Priority[] = []
    if (idx > 0) alternatives.push(order[idx - 1])
    if (idx < order.length - 1) alternatives.push(order[idx + 1])
    return alternatives
  }

  async getPriorityInsights(userId: string): Promise<PriorityInsight[]> {
    const result = await this.analyzeAndRecommend(userId)
    const tasks = await prisma.task.findMany({ where: { userId } })

    return result.recommendations.map(rec => ({
      taskId: rec.taskId,
      title: tasks.find(t => t.id === rec.taskId)?.title || 'Unknown',
      currentPriority: this.getTaskPriority(rec.taskId),
      suggestedPriority: rec.suggestedPriority,
      confidence: rec.confidence,
      reasoning: rec.reason,
      alternatives: rec.alternativePriorities
    }))
  }

  private async getTaskPriority(taskId: string): Promise<Priority> {
    const task = await prisma.task.findUnique({ where: { id: taskId } })
    return task?.priority as Priority || Priority.NORMAL
  }
}

export const smartPriority = new SmartPriorityEngine()