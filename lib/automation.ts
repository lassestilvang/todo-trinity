import { prisma } from '@/lib/prisma'
import { TaskStatus, Priority } from '@/src/types/index'

export interface Trigger {
  id: string
  type: 'schedule' | 'task_created' | 'task_updated' | 'task_completed' | 'priority_changed' | 'label_changed' | 'list_changed'
  config: Record<string, any>
  isActive: boolean
}

export interface Action {
  id: string
  type: 'create_task' | 'update_task' | 'assign_task' | 'add_label' | 'move_task' | 'send_notification' | 'webhook'
  config: Record<string, any>
  order: number
}

export interface AutomationRule {
  id: string
  name: string
  description?: string
  trigger: Trigger
  actions: Action[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  executionCount: number
  lastExecuted?: Date
}

export class AutomationEngine {
  private rules: AutomationRule[] = []

  constructor() {
    this.rules = []
  }

  registerRule(rule: AutomationRule): void {
    this.rules.push(rule)
  }

  getRules(): AutomationRule[] {
    return [...this.rules]
  }

  getRule(id: string): AutomationRule | undefined {
    return this.rules.find(r => r.id === id)
  }

  updateRule(id: string, updates: Partial<AutomationRule>): AutomationRule | null {
    const index = this.rules.findIndex(r => r.id === id)
    if (index === -1) return null
    this.rules[index] = { ...this.rules[index], ...updates, updatedAt: new Date() }
    return this.rules[index]
  }

  deleteRule(id: string): boolean {
    const index = this.rules.findIndex(r => r.id === id)
    if (index === -1) return false
    this.rules.splice(index, 1)
    return true
  }

  async executeRule(rule: AutomationRule): Promise<boolean> {
    if (!rule.isActive) return false

    try {
      for (const action of rule.actions) {
        await this.executeAction(action)
      }

      // Update execution count
      this.updateRule(rule.id, {
        executionCount: rule.executionCount + 1,
        lastExecuted: new Date()
      })

      return true
    } catch (error) {
      console.error(`Automation rule execution failed: ${rule.id}`, error)
      return false
    }
  }

  private async executeAction(action: Action): Promise<void> {
    switch (action.type) {
      case 'create_task':
        await this.executeCreateTask(action.config)
        break

      case 'update_task':
        await this.executeUpdateTask(action.config)
        break

      case 'assign_task':
        await this.executeAssignTask(action.config)
        break

      case 'add_label':
        await this.executeAddLabel(action.config)
        break

      case 'move_task':
        await this.executeMoveTask(action.config)
        break

      case 'send_notification':
        await this.executeSendNotification(action.config)
        break

      case 'webhook':
        await this.executeWebhook(action.config)
        break

      default:
        console.warn(`Unknown action type: ${action.type}`)
    }
  }

  private async executeCreateTask(config: any): Promise<void> {
    const { title, description, priority, listId, labelIds, dueDate, assignedToId, userId: configUserId } = config

    await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || Priority.LOW,
        status: TaskStatus.TODO,
        listId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        labels: labelIds && labelIds.length > 0
          ? { connect: labelIds.map((id: string) => ({ id })) }
          : undefined,
        userId: assignedToId || configUserId,
      }
    })
  }

  private async executeUpdateTask(config: any): Promise<void> {
    const { taskId, updates } = config
    if (!taskId) return

    await prisma.task.update({
      where: { id: taskId },
      data: updates
    })
  }

  private async executeAssignTask(config: any): Promise<void> {
    const { taskId, assignedToId } = config
    if (!taskId) return

    // Assigning tasks to users is no longer supported
    // Skip this operation
  }

  private async executeAddLabel(config: any): Promise<void> {
    const { taskId, labelId } = config
    if (!taskId) return

    if (labelId) {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          labels: {
            connect: { id: labelId }
          }
        }
      })
    }
  }

  private async executeMoveTask(config: any): Promise<void> {
    const { taskId, listId } = config
    if (!taskId) return

    await prisma.task.update({
      where: { id: taskId },
      data: { listId }
    })
  }

  private async executeSendNotification(config: any): Promise<void> {
    const { title, message, userId, channel } = config

    if (channel === 'in_app') {
      await prisma.notification.create({
        data: {
          title,
          message,
          type: 'info',
          read: false,
          user: { connect: { id: userId } }
        }
      })
    }
    // Email/slack notifications would be handled by separate services
  }

  private async executeWebhook(config: any): Promise<void> {
    const { url, method, headers, body } = config

    try {
      const response = await fetch(url, {
        method: method || 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        console.error(`Webhook failed: ${response.status}`)
      }
    } catch (error) {
      console.error('Webhook execution failed:', error)
    }
  }

  // Trigger-based execution
  async handleEvent(
    eventType: Trigger['type'],
    eventData: any
  ): Promise<void> {
    const matchingRules = this.rules.filter(rule =>
      rule.isActive &&
      rule.trigger.type === eventType &&
      this.matchesTriggerConfig(rule.trigger, eventData)
    )

    for (const rule of matchingRules) {
      await this.executeRule(rule)
    }
  }

  private matchesTriggerConfig(trigger: Trigger, eventData: any): boolean {
    const { config } = trigger

    // Schedule triggers don't have event data
    if (trigger.type === 'schedule') return true

    // Task-based triggers
    switch (trigger.type) {
      case 'task_created':
      case 'task_updated':
      case 'task_completed':
        if (config.priority && eventData.priority !== config.priority) return false
        if (config.labelIds && config.labelIds.length > 0) {
          const taskLabels = eventData.labels || []
          if (!config.labelIds.some((id: string) => taskLabels.includes(id))) return false
        }
        if (config.listId && eventData.listId !== config.listId) return false
        if (config.assignedTo && eventData.assignedToId !== config.assignedTo) return false
        return true

      default:
        return true
    }
  }

  // Predefined automation rules
  getSuggestedAutomations(): AutomationRule[] {
    return [
      {
        id: 'auto-urgent-deadline',
        name: 'Auto-Escalate Overdue Tasks',
        description: 'Move overdue high priority tasks to URGENT',
        trigger: {
          id: 'trigger-1',
          type: 'schedule',
          config: { schedule: '0 9 * * *' },
          isActive: true
        },
        actions: [
          {
            id: 'action-1',
            type: 'update_task',
            config: {
              taskId: '{{overdueTaskId}}',
              updates: { priority: Priority.URGENT }
            },
            order: 0
          }
        ],
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        executionCount: 0
      },
      {
        id: 'welcome-task',
        name: 'Auto-create Onboarding Task',
        description: 'Create a welcome task when a new user joins a workspace',
        trigger: {
          id: 'trigger-2',
          type: 'task_created',
          config: { labelIds: [], priority: Priority.NORMAL },
          isActive: true
        },
        actions: [
          {
            id: 'action-2',
            type: 'send_notification',
            config: {
              title: 'New task created!',
              message: 'A new task was created',
              channel: 'in_app'
            },
            order: 0
          }
        ],
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        executionCount: 0
      },
      {
        id: 'completed-label',
        name: 'Auto-label Completed Tasks',
        description: 'Add "completed" label to tasks marked as complete',
        trigger: {
          id: 'trigger-3',
          type: 'task_completed',
          config: {},
          isActive: true
        },
        actions: [
          {
            id: 'action-3',
            type: 'add_label',
            config: {
              taskId: '{{taskId}}',
              labelName: 'completed'
            },
            order: 0
          }
        ],
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        executionCount: 0
      }
    ]
  }
}

export const automationEngine = new AutomationEngine()