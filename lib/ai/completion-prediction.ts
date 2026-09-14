import { prisma } from '@/lib/prisma'
import { Task, Priority, TaskStatus } from '@/src/types/index'
import { CompletionPrediction } from '@/lib/ai/types'

interface HistoricalPattern {
  priority: Priority
  dayOfWeek: number
  hourOfDay: number
  duration: number
  success: boolean
}

interface SimilarTask extends Partial<Task> {
  similarityScore: number
}

export class CompletionPredictor {
  private historicalPatterns: HistoricalPattern[] = []

  async analyzeHistoricalData(userId: string): Promise<void> {
    const completedTasks = await prisma.task.findMany({
      where: {
        userId,
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

    this.historicalPatterns = completedTasks.map(task => {
      const created = new Date(task.createdAt)
      const completed = new Date(task.completedAt!)
      const durationMinutes = (completed.getTime() - created.getTime()) / (1000 * 60)

      return {
        priority: task.priority as Priority,
        dayOfWeek: created.getDay(),
        hourOfDay: created.getHours(),
        duration: Math.round(durationMinutes || 60),
        success: true
      }
    })
  }

  async predictCompletionTime(
    userId: string,
    task: Partial<Task>
  ): Promise<CompletionPrediction> {
    await this.analyzeHistoricalData(userId)

    // Find similar historical tasks
    const similarTasks = this.findSimilarTasks(task)

    // Calculate base estimate
    let estimatedMinutes = this.calculateBaseEstimate(task)

    // Apply pattern adjustments
    const patternAdjustment = this.calculatePatternAdjustment()
    estimatedMinutes = Math.max(5, estimatedMinutes + patternAdjustment)

    // Confidence based on historical data similarity
    const confidence = similarTasks.length > 0
      ? Math.min(95, 50 + (similarTasks.length * 5) + (task.priority === Priority.LOW ? -10 : task.priority === Priority.URGENT ? 10 : 0))
      : 70

    // Calculate completion probability
    const probability = this.calculateCompletionProbability(task, similarTasks)

    // Calculate confidence window (±30% typically)
    const variance = estimatedMinutes * 0.3
    const minMinutes = Math.max(5, estimatedMinutes - variance)
    const maxMinutes = estimatedMinutes + variance

    return {
      taskId: task.id!,
      estimatedMinutes: Math.round(estimatedMinutes),
      confidence: Math.round(confidence),
      probabilityOfCompletionOnTime: Math.round(probability),
      suggestedDueDate: task.dueDate ? undefined : this.calculateSuggestedDueDate(estimatedMinutes),
      minMinutes: Math.round(minMinutes),
      maxMinutes: Math.round(maxMinutes)
    }
  }

  private findSimilarTasks(task: Partial<Task>): SimilarTask[] {
    if (this.historicalPatterns.length === 0) return []

    // Calculate similarity based on priority, labels, list, and description keywords
    const taskKeywords = this.extractKeywords(task.title, task.description)

    return this.historicalPatterns
      .map(pattern => {
        let score = 0

        // Priority match (40% weight)
        if ((task.priority as Priority) === pattern.priority) score += 40

        // Time of day match (20% weight)
        const currentHour = new Date().getHours()
        if (currentHour === pattern.hourOfDay) score += 20

        // Day of week match (15% weight)
        const currentDay = new Date().getDay()
        if (currentDay === pattern.dayOfWeek) score += 15

        // Successful completion (25% weight)
        if (pattern.success) score += 25

        return {
          ...task,
          similarityScore: score
        }
      })
      .filter(t => t.similarityScore > 30) // Minimum threshold
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 10) // Top 10 similar
  }

  private extractKeywords(title: string | undefined, description: string | undefined): Set<string> {
    const text = `${title || ''} ${description || ''}`.toLowerCase()
    const words = text.split(/\s+/)

    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'to', 'for', 'of', 'in', 'on', 'with', 'by'])
    const keywords = new Set<string>()

    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '')
      if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
        keywords.add(cleanWord)
      }
    }

    return keywords
  }

  private calculateBaseEstimate(task: Partial<Task>): number {
    const baseDurations = {
      [Priority.URGENT]: 45,
      [Priority.HIGH]: 90,
      [Priority.NORMAL]: 120,
      [Priority.LOW]: 30
    }

    let estimate = baseDurations[task.priority as Priority] || 60

    // Adjust based on task complexity indicators
    const description = (task.description || '').toLowerCase()
    const title = (task.title || '').toLowerCase()

    // Multipliers for complexity
    if (description.includes('review') || description.includes('check')) estimate *= 0.7
    if (description.includes('meeting') || description.includes('call')) estimate *= 1.5
    if (description.includes('report') || description.includes('document')) estimate *= 2
    if (description.includes('code') || description.includes('develop')) estimate *= 1.8
    if (title.includes('setup') || title.includes('configure')) estimate *= 2.5
    if (task.labels?.some(l => l.name.includes('#complex'))) estimate *= 1.5
    if (task.subtasks && task.subtasks.length > 0) estimate *= (1 + task.subtasks.length * 0.3)

    return estimate
  }

  private calculatePatternAdjustment(): number {
    if (this.historicalPatterns.length === 0) return 0

    const avgDuration = this.historicalPatterns.reduce((sum, p) => sum + p.duration, 0) / this.historicalPatterns.length

    // Compare current time patterns with historical
    const currentHour = new Date().getHours()
    const currentDay = new Date().getDay()

    const currentPatterns = this.historicalPatterns.filter(
      p => p.hourOfDay === currentHour && p.dayOfWeek === currentDay
    )

    if (currentPatterns.length === 0) return 0

    const avgCurrentDuration = currentPatterns.reduce((sum, p) => sum + p.duration, 0) / currentPatterns.length
    return avgCurrentDuration - avgDuration
  }

  private calculateCompletionProbability(
    task: Partial<Task>,
    similarTasks: SimilarTask[]
  ): number {
    if (similarTasks.length === 0) return 0.5

    // Base probability from similar task success
    let probability = 0.5 // Start at 50%

    // Factor in deadline proximity
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate)
      const now = new Date()
      const daysDiff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

      if (daysDiff < 0) probability -= 0.3
      else if (daysDiff < 1) probability -= 0.1
      else if (daysDiff < 3) probability += 0.1
      else if (daysDiff < 7) probability += 0.2
    } else if (!task.dueDate) {
      // No deadline - slightly lower probability
      probability -= 0.1
    }

    // Factor in priority
    if (task.priority === Priority.URGENT) probability += 0.15
    else if (task.priority === Priority.HIGH) probability += 0.05
    else if (task.priority === Priority.LOW) probability -= 0.1

    // Factor in similar task performance
    const similarSuccessRate = similarTasks.filter(t => t.similarityScore > 50).length / Math.max(1, similarTasks.length)
    probability = probability * 0.7 + similarSuccessRate * 0.3

    return Math.min(0.95, Math.max(0.05, probability))
  }

  private calculateSuggestedDueDate(estimatedMinutes: number): Date {
    // Suggest due date 3 days out as default
    const suggested = new Date()
    suggested.setDate(suggested.getDate() + 3)
    return suggested
  }
}

export const completionPredictor = new CompletionPredictor()