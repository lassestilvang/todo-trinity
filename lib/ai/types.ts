import { Task, Priority } from '@/src/types/index'

export interface CompletedTask {
  id: string
  title: string
  completedAt: string
  priority: Priority
  dueDate?: string | null
  description?: string | null
}

export interface PriorityInsight {
  taskId: string
  title: string
  currentPriority: Priority
  suggestedPriority: Priority
  confidence: number // 0-100
  reasoning: string
  alternatives: Priority[]
}

export interface ProductivityPattern {
  hour: number
  dayOfWeek: number
  avgCompletionRate: number
  taskCount: number
  avgDuration: number
}

export interface PriorityContext {
  userId: string
  taskId: string | null
  allTasks: Task[]
  completedTasks: CompletedTask[]
  workload: WorkloadInfo
  deadlines: DeadlineInfo[]
}

export interface WorkloadInfo {
  totalTasks: number
  activeTasks: number
  completedToday: number
  overdueTasks: number
}

export interface DeadlineInfo {
  taskId: string
  dueDate: string
  daysRemaining: number
  riskLevel: 'low' | 'medium' | 'high'
}

export interface PriorityRecommendation {
  taskId: string
  currentPriority: Priority
  suggestedPriority: Priority
  confidence: number
  reason: string
  alternativePriorities: Priority[]
}

export interface SmartPriorityResult {
  recommendations: PriorityRecommendation[]
  updatedAt: string
  generatedBy: 'ai' | 'rule-based'
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

export interface TimeBlock {
  startTime: Date
  endTime: Date
  taskId: string
  taskTitle: string
  priority: Priority
}

export interface CompletionPrediction {
  taskId: string
  estimatedMinutes: number
  confidence: number
  probabilityOfCompletionOnTime: number
  suggestedDueDate?: Date
  minMinutes: number
  maxMinutes: number
}

export interface HistoricalPattern {
  priority: Priority
  dayOfWeek: number
  hourOfDay: number
  duration: number
  success: boolean
}

export interface SimilarTask extends Partial<Task> {
  similarityScore: number
}