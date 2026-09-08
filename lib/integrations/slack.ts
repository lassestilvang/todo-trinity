"use client"

import { BaseIntegration, Integration, IntegrationConfig } from './base'

export class SlackIntegration extends BaseIntegration {
  private accessToken: string | null = null

  constructor(config: IntegrationConfig) {
    super(config)
  }

  async authenticate(userId: string, credentials: Record<string, any>): Promise<Integration> {
    if (!credentials?.accessToken) {
      throw new Error('Slack access token is required')
    }

    this.accessToken = credentials.accessToken

    // Test the connection
    try {
      const response = await this.makeRequest('https://slack.com/api/auth.test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to authenticate with Slack')
      }

      return {
        id: `slack-${userId}`,
        provider: this.config.provider,
        type: this.config.type,
        config: this.config,
        connected: true,
        lastSync: new Date().toISOString(),
        syncStatus: 'success',
        metadata: {
          team: response.team,
          user: response.user,
          url: response.url
        }
      }
    } catch (error) {
      throw new Error(`Slack authentication failed: ${error.message}`)
    }
  }

  async sync(userId: string): Promise<Integration> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Slack')
    }

    try {
      // Sync channels and recent messages
      const [channelsResponse, authResponse] = await Promise.all([
        this.makeRequest('https://slack.com/api/conversations.list', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          }
        }),
        this.makeRequest('https://slack.com/api/auth.test', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          }
        })
      ])

      return {
        id: `slack-${userId}`,
        provider: this.config.provider,
        type: this.config.type,
        config: this.config,
        connected: true,
        lastSync: new Date().toISOString(),
        syncStatus: 'success',
        metadata: {
          channels: channelsResponse.channels?.slice(0, 10) || [],
          team: authResponse.team,
          user: authResponse.user
        }
      }
    } catch (error) {
      return {
        id: `slack-${userId}`,
        provider: this.config.provider,
        type: this.config.type,
        config: this.config,
        connected: false,
        lastSync: new Date().toISOString(),
        syncStatus: 'error',
        error: error.message
      }
    }
  }

  async disconnect(userId: string): Promise<boolean> {
    try {
      await this.makeRequest('https://slack.com/api/auth.revoke', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      this.accessToken = null
      return true
    } catch (error) {
      console.error('Failed to disconnect Slack:', error)
      return false
    }
  }

  async handleWebhook(payload: any): Promise<void> {
    // Handle incoming Slack events (slash commands, button clicks, etc.)
    if (payload.type === 'event_callback') {
      const event = payload.event

      if (event.type === 'message' && event.subtype !== 'bot_message') {
        // Create task from Slack message
        const taskContent = event.text.replace(/^\/todo\s+/i, '').trim()
        if (taskContent) {
          // Would trigger task creation via API
          console.log('Creating task from Slack message:', taskContent)
        }
      }
    }
  }

  getCapabilities(): string[] {
    return [
      'Send task notifications to channels',
      'Create tasks from slash commands (/todo)',
      'React to messages to create tasks',
      'Sync task updates to channels',
      'Receive reminders and mentions'
    ]
  }
}

export const slackIntegration = new SlackIntegration(integrationConfigs.find(c => c.id === 'slack')!)