// Zapier integration utilities

export interface ZapierWebhook {
  id: string
  trigger: string
  data: any
  url: string
  secret?: string
  active: boolean
  lastExecuted?: Date
  errorCount: number
  successCount: number
}

export interface ZapierTrigger {
  id: string
  name: string
  description: string
  webhookUrl: string
  event: 'created' | 'updated' | 'deleted' | 'completed'
  entity: 'task' | 'list' | 'label' | 'comment' | 'workspace'
  sampleData: any
}

export interface ZapierAction {
  id: string
  name: string
  description: string
  type: 'http' | 'email' | 'slack' | 'discord' | 'teams' | 'webhook'
  configuration: any
  enabled: boolean
}

// Common Zapier triggers
export const ZAPIR_TRIGGERS: ZapierTrigger[] = [
  {
    id: 'task.created',
    name: 'Task Created',
    description: 'Trigger when a new task is created',
    webhookUrl: 'https://hooks.zapier.com/hooks/catch/123456/abc123/',
    event: 'created',
    entity: 'task',
    sampleData: {
      id: 'task_123',
      title: 'New task',
      description: 'Task description',
      created_at: '2023-01-01T00:00:00Z',
      priority: 'HIGH',
      user_id: 'user_123'
    }
  },
  {
    id: 'task.updated',
    name: 'Task Updated',
    description: 'Trigger when a task is updated',
    webhookUrl: 'https://hooks.zapier.com/hooks/catch/123456/def456/',
    event: 'updated',
    entity: 'task',
    sampleData: {
      id: 'task_123',
      title: 'Updated task',
      status: 'IN_PROGRESS',
      updated_at: '2023-01-01T01:00:00Z',
      user_id: 'user_123'
    }
  },
  {
    id: 'task.completed',
    name: 'Task Completed',
    description: 'Trigger when a task is completed',
    webhookUrl: 'https://hooks.zapier.com/hooks/catch/123456/ghi789/',
    event: 'completed',
    entity: 'task',
    sampleData: {
      id: 'task_123',
      title: 'Completed task',
      completed_at: '2023-01-01T02:00:00Z',
      user_id: 'user_123'
    }
  },
  {
    id: 'list.created',
    name: 'List Created',
    description: 'Trigger when a new list is created',
    webhookUrl: 'https://hooks.zapier.com/hooks/catch/123456/jkl012/',
    event: 'created',
    entity: 'list',
    sampleData: {
      id: 'list_123',
      name: 'New list',
      color: '#FF0000',
      created_at: '2023-01-01T00:00:00Z',
      user_id: 'user_123'
    }
  },
  {
    id: 'comment.created',
    name: 'Comment Created',
    description: 'Trigger when a comment is added to a task',
    webhookUrl: 'https://hooks.zapier.com/hooks/catch/123456/mno345/',
    event: 'created',
    entity: 'comment',
    sampleData: {
      id: 'comment_123',
      content: 'Great work!',
      task_id: 'task_123',
      user_id: 'user_456',
      created_at: '2023-01-01T00:30:00Z'
    }
  }
]

// Common Zapier actions
export const ZAPIR_ACTIONS: ZapierAction[] = [
  {
    id: 'create_slack_message',
    name: 'Send Slack Message',
    description: 'Send a message to a Slack channel',
    type: 'slack',
    configuration: {
      channel: '#general',
      message_template: '{task.title} has been updated: {task.status}',
      mention_users: true
    },
    enabled: true
  },
  {
    id: 'send_email',
    name: 'Send Email',
    description: 'Send an email notification',
    type: 'email',
    configuration: {
      to: 'user@example.com',
      subject: 'Task Update: {task.title}',
      body: 'Task {task.title} status changed to {task.status}',
      include_attachments: true
    },
    enabled: true
  },
  {
    id: 'create_jira_ticket',
    name: 'Create Jira Ticket',
    description: 'Create a new issue in Jira',
    type: 'http',
    configuration: {
      project: 'PROJ',
      issue_type: 'Task',
      summary: '{task.title} (From Todo Trinity)',
      description: 'Task details: {task.description}'
    },
    enabled: true
  },
  {
    id: 'update_discord_role',
    name: 'Update Discord Role',
    description: 'Update user roles in Discord based on task completion',
    type: 'discord',
    configuration: {
      server_id: 'discord_server_id',
      role_id: 'role_id',
      condition: 'task.completed_count >= 5'
    },
    enabled: true
  }
]

// ZapierIntegration class for the integration system
export class ZapierIntegration {
  protected config: any

  constructor(config: any) {
    this.config = config
  }

  async authenticate(userId: string, credentials: any): Promise<any> {
    // In production, validate OAuth or API key
    return {
      connected: true,
      lastSync: new Date().toISOString(),
      syncStatus: 'success',
      metadata: {
        integrationId: this.config.id,
        user: userId
      }
    }
  }

  async sync(userId: string): Promise<any> {
    // Trigger webhook to check for pending actions
    await fetch('/api/integrations/zapier/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trigger: 'sync',
        data: { userId }
      })
    })
    return {
      connected: true,
      lastSync: new Date().toISOString(),
      syncStatus: 'success',
      metadata: {
        integrationId: this.config.id,
        user: userId,
        eventsSynced: 0
      }
    }
  }

  async disconnect(userId: string): Promise<boolean> {
    // Clean up webhook subscriptions, etc.
    return true
  }

  handleWebhook(payload: any): Promise<void> {
    // Process incoming webhook data from Zapier
    return Promise.resolve()
  }

  getCapabilities(): string[] {
    return [
      'Task creation events',
      'Task update events',
      'Task completion events',
      'List creation events',
      'Comment events',
      'Custom webhook triggers',
      'Cross-platform automation'
    ]
  }
}

// Default exported utility functions
export const createWebhookPayload = (
  trigger: string,
  entity: string,
  data: any
) => {
  return {
    event: trigger,
    entity,
    timestamp: new Date().toISOString(),
    data: data,
    meta: {
      source: 'todo-trinity',
      version: '1.0.0'
    }
  }
}

// Execute Zapier webhook
export async function executeZapierWebhook(
  trigger: string,
  data: any,
  apiKey?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = createWebhookPayload(trigger, data.entity, data)

    const response = await fetch('https://hooks.zapier.com/hooks/catch/webhook_id/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Zapier-Signature': apiKey ? generateSignature(payload, apiKey) : '',
        'User-Agent': 'TodoTrinity-Integration/1.0.0'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Zapier API error: ${response.status} ${response.statusText}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to execute Zapier webhook:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Generate HMAC signature for webhook authentication
function generateSignature(payload: any, secret: string): string {
  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(JSON.stringify(payload))
  return hmac.digest('hex')
}

// Validate Zapier webhook signature
function validateZapierSignature(payload: any, signature: string, secret: string): boolean {
  const crypto = require('crypto')
  const expectedSignature = generateSignature(payload, secret)
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))
}

// Export integration configs for the integration system
export const ZAPIER_INTEGRATION_CONFIG = {
  id: 'zapier',
  name: 'Zapier',
  type: 'automation',
  provider: 'zapier',
  authType: 'api_key',
  scopes: ['*'],
  icon: '⚡',
  color: '#FF4D4F',
  description: 'Connect with 5000+ apps via Zapier webhooks',
  integrationClass: ZapierIntegration
}