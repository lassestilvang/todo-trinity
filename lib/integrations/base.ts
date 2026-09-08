"use client"

export interface IntegrationConfig {
  id: string
  name: string
  type: 'calendar' | 'communication' | 'project_management' | 'storage' | 'automation'
  provider: string
  authType: 'oauth' | 'api_key' | 'basic'
  scopes: string[]
  icon: string
  color: string
  description: string
}

export interface Integration {
  id: string
  provider: string
  type: IntegrationConfig['type']
  config: IntegrationConfig
  connected: boolean
  lastSync?: string
  syncStatus: 'idle' | 'syncing' | 'error' | 'success'
  error?: string
  metadata?: Record<string, any>
}

export abstract class BaseIntegration {
  protected config: IntegrationConfig

  constructor(config: IntegrationConfig) {
    this.config = config
  }

  abstract authenticate(userId: string, credentials: Record<string, any>): Promise<Integration>
  abstract sync(userId: string): Promise<Integration>
  abstract disconnect(userId: string): Promise<boolean>
  abstract handleWebhook(payload: any): Promise<void>
  abstract getCapabilities(): string[]

  getConfig(): IntegrationConfig {
    return this.config
  }

  getCapabilitiesSync(): string[] {
    return [
      'Task creation',
      'Task updates',
      'Real-time notifications',
      'Calendar sync',
      'File attachment'
    ]
  }

  async validateCredentials(credentials: Record<string, any>): Promise<boolean> {
    return !!(credentials && Object.keys(credentials).length > 0)
  }

  async getAuthUrl(userId: string, redirectUri: string): Promise<string> {
    // Default implementation - subclasses should override
    return `${this.config.name}/auth?user=${userId}&redirect=${encodeURIComponent(redirectUri)}`
  }

  protected async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`${this.config.name} API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }
}

export const integrationConfigs: IntegrationConfig[] = [
  {
    id: 'slack',
    name: 'Slack',
    type: 'communication',
    provider: 'slack',
    authType: 'oauth',
    scopes: ['chat:write', 'chat:write.public', 'channels:read', 'users:read'],
    icon: '💬',
    color: '#4A154B',
    description: 'Get task notifications and create tasks from Slack messages'
  },
  {
    id: 'github',
    name: 'GitHub',
    type: 'project_management',
    provider: 'github',
    authType: 'oauth',
    scopes: ['repo', 'user:email', 'read:org'],
    icon: '-Octicon',
    color: '#181717',
    description: 'Link tasks to issues and pull requests'
  },
  {
    id: 'jira',
    name: 'Jira',
    type: 'project_management',
    provider: 'jira',
    authType: 'oauth',
    scopes: ['read:jira-work', 'write:jira-work', 'manage:jira-configuration'],
    icon: '•',
    color: '#0052CC',
    description: 'Sync tasks with Jira issues and projects'
  },
  {
    id: 'notion',
    name: 'Notion',
    type: 'storage',
    provider: 'notion',
    authType: 'oauth',
    scopes: ['read', 'write'],
    icon: '📝',
    color: '#000000',
    description: 'Create tasks from Notion pages and databases'
  },
  {
    id: 'zapier',
    name: 'Zapier',
    type: 'automation',
    provider: 'zapier',
    authType: 'api_key',
    scopes: ['*'],
    icon: '⚡',
    color: '#FF4D4F',
    description: 'Connect with 5000+ apps via Zapier webhooks'
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    type: 'calendar',
    provider: 'google',
    authType: 'oauth',
    scopes: ['calendar', 'calendar.events'],
    icon: '📅',
    color: '#4285F4',
    description: 'Two-way sync with Google Calendar'
  },
  {
    id: 'outlook-calendar',
    name: 'Outlook Calendar',
    type: 'calendar',
    provider: 'microsoft',
    authType: 'oauth',
    scopes: ['calendars.readwrite', 'offline_access'],
    icon: '📅',
    color: '#0078D4',
    description: 'Two-way sync with Microsoft Outlook Calendar'
  }
]