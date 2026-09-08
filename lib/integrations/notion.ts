"use client"

import { BaseIntegration, Integration, IntegrationConfig, integrationConfigs } from './base'

export interface NotionPage {
  id: string
  title: string
  url: string
  created_time: string
  last_edited_time: string
  properties: Record<string, any>
}

export interface NotionDatabase {
  id: string
  title: string
  url: string
  properties: Record<string, any>
  created_time: string
}

export class NotionIntegration extends BaseIntegration {
  private accessToken: string | null = null
  private botId: string | null = null

  constructor(config: IntegrationConfig) {
    super(config)
  }

  async authenticate(userId: string, credentials: Record<string, any>): Promise<Integration> {
    if (!credentials?.accessToken) {
      throw new Error('Notion access token is required')
    }

    this.accessToken = credentials.accessToken

    try {
      const response = await this.makeRequest('https://api.notion.com/v1/users/me', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Notion-Version': '2022-06-28'
        }
      })

      this.botId = response.id

      return {
        id: `notion-${userId}`,
        provider: this.config.provider,
        type: this.config.type,
        config: this.config,
        connected: true,
        lastSync: new Date().toISOString(),
        syncStatus: 'success',
        metadata: {
          bot_id: response.id,
          name: response.name,
          type: response.type
        }
      }
    } catch (error) {
      throw new Error(`Notion authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async sync(userId: string): Promise<Integration> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Notion')
    }

    try {
      // Get databases and recent pages
      const [databases, pages] = await Promise.all([
        this.getDatabases(),
        this.getRecentPages()
      ])

      return {
        id: `notion-${userId}`,
        provider: this.config.provider,
        type: this.config.type,
        config: this.config,
        connected: true,
        lastSync: new Date().toISOString(),
        syncStatus: 'success',
        metadata: {
          databases: databases.slice(0, 20),
          pages: pages.slice(0, 50),
          totalDatabases: databases.length,
          totalPages: pages.length
        }
      }
    } catch (error) {
      return {
        id: `notion-${userId}`,
        provider: this.config.provider,
        type: this.config.type,
        config: this.config,
        connected: true,
        lastSync: new Date().toISOString(),
        syncStatus: 'error',
        error: error instanceof Error ? error.message : 'Sync failed'
      }
    }
  }

  async disconnect(userId: string): Promise<boolean> {
    this.accessToken = null
    this.botId = null
    return true
  }

  async handleWebhook(payload: any): Promise<void> {
    // Handle Notion webhooks (if/when they add support)
    console.log('Notion webhook received:', payload)
  }

  getCapabilities(): string[] {
    return [
      'Create tasks from Notion pages',
      'Sync databases as task lists',
      'Update Notion pages from task changes',
      'Create rich content in Notion from tasks',
      'Search across Notion workspace'
    ]
  }

  private async getDatabases(): Promise<NotionDatabase[]> {
    try {
      const response = await this.makeRequest('https://api.notion.com/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filter: { property: 'object', value: 'database' },
          page_size: 100
        })
      })

      return response.results || []
    } catch (error) {
      console.error('Failed to fetch Notion databases:', error)
      return []
    }
  }

  private async getRecentPages(): Promise<NotionPage[]> {
    try {
      const response = await this.makeRequest('https://api.notion.com/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filter: { property: 'object', value: 'page' },
          sort: { direction: 'descending', timestamp: 'last_edited_time' },
          page_size: 50
        })
      })

      return response.results || []
    } catch (error) {
      console.error('Failed to fetch Notion pages:', error)
      return []
    }
  }

  async createPageFromTask(databaseId: string, task: {
    title: string
    description?: string
    status?: string
    priority?: string
    dueDate?: string
    labels?: string[]
  }): Promise<NotionPage> {
    const properties: Record<string, any> = {
      'Name': {
        title: [{ text: { content: task.title } }]
      }
    }

    if (task.description) {
      properties['Description'] = {
        rich_text: [{ text: { content: task.description } }]
      }
    }

    if (task.status) {
      properties['Status'] = {
        select: { name: task.status }
      }
    }

    if (task.priority) {
      properties['Priority'] = {
        select: { name: task.priority }
      }
    }

    if (task.dueDate) {
      properties['Due Date'] = {
        date: { start: task.dueDate }
      }
    }

    if (task.labels && task.labels.length > 0) {
      properties['Labels'] = {
        multi_select: task.labels.map(l => ({ name: l }))
      }
    }

    const response = await this.makeRequest('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties
      })
    })

    return response
  }

  async updatePageFromTask(pageId: string, task: {
    title?: string
    description?: string
    status?: string
    priority?: string
    dueDate?: string
    labels?: string[]
  }): Promise<NotionPage> {
    const properties: Record<string, any> = {}

    if (task.title) {
      properties['Name'] = {
        title: [{ text: { content: task.title } }]
      }
    }

    if (task.description) {
      properties['Description'] = {
        rich_text: [{ text: { content: task.description } }]
      }
    }

    if (task.status) {
      properties['Status'] = {
        select: { name: task.status }
      }
    }

    if (task.priority) {
      properties['Priority'] = {
        select: { name: task.priority }
      }
    }

    if (task.dueDate) {
      properties['Due Date'] = {
        date: { start: task.dueDate }
      }
    }

    if (task.labels && task.labels.length > 0) {
      properties['Labels'] = {
        multi_select: task.labels.map(l => ({ name: l }))
      }
    }

    const response = await this.makeRequest(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ properties })
    })

    return response
  }
}

export { integrationConfigs }