"use client"

import { BaseIntegration, Integration, IntegrationConfig } from './base'

export interface MondayBoard {
  id: string
  title: string
  description: string
  state: 'active' | 'archived' | 'deleted'
  permissions: string[]
  columns: MondayColumn[]
  groups: MondayGroup[]
}

export interface MondayColumn {
  id: string
  title: string
  type: string
  settings: Record<string, any>
}

export interface MondayGroup {
  id: string
  title: string
  color: string
  position: number
}

export interface MondayItem {
  id: string
  name: string
  board: { id: string; title: string }
  column_values: Record<string, { text: string; value: string }>
  group: { id: string; title: string } | null
  created_at: string
  updated_at: string
  state: 'active' | 'archived' | 'deleted'
}

export class MondayIntegration extends BaseIntegration {
  private accessToken: string | null = null
  private boards: MondayBoard[] = []

  constructor(config: IntegrationConfig) {
    super(config)
  }

  async authenticate(userId: string, credentials: Record<string, any>): Promise<Integration> {
    if (!credentials?.accessToken) {
      throw new Error('Monday.com access token is required')
    }

    this.accessToken = credentials.accessToken

    try {
      const token = this.accessToken || '';
      const [userResponse, boardsResponse] = await Promise.all([
        this.makeRequest('https://api.monday.com/v2', {
          method: 'POST',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `{
              me {
                id
                name
                email
                title
                url
              }
            }`,
          }),
        }),
        this.makeRequest('https://api.monday.com/v2', {
          method: 'POST',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `{
              boards(limit: 100) {
                id
                title
                description
                state
                permissions
                columns {
                  id
                  title
                  type
                }
                groups {
                  id
                  title
                  color
                  position
                }
              }
            }`,
          }),
        }),
      ])

      this.boards = boardsResponse?.data?.boards || []

      return {
        id: `monday-com-${userId}`,
        provider: this.config.provider,
        type: this.config.type,
        config: this.config,
        connected: true,
        lastSync: new Date().toISOString(),
        syncStatus: 'success',
        metadata: {
          user: userResponse?.data?.me?.name,
          email: userResponse?.data?.me?.email,
          boards: this.boards.length,
        },
      }
    } catch (error) {
      throw new Error(`Monday.com authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async sync(userId: string): Promise<Integration> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Monday.com')
    }

    try {
      const items: MondayItem[] = []

      for (const board of this.boards) {
        try {
          const token = this.accessToken || '';
          const response = await this.makeRequest('https://api.monday.com/v2', {
            method: 'POST',
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: `query($boardId: String!) {
                boards(ids: [$boardId]) {
                  items(limit: 100) {
                    id
                    name
                    column_values {
                      id
                      text
                      value
                    }
                    group {
                      id
                      title
                    }
                    created_at
                    updated_at
                    state
                  }
                }
              }`,
              variables: { boardId: board.id },
            }),
          })

          const boardItems = response?.data?.boards?.[0]?.items || []
          items.push(...boardItems)
        } catch (error) {
          console.warn(`Failed to fetch items for board ${board.title}:`, error)
        }
      }

      return {
        id: `monday-com-${userId}`,
        provider: this.config.provider,
        type: this.config.type,
        config: this.config,
        connected: true,
        lastSync: new Date().toISOString(),
        syncStatus: 'success',
        metadata: {
          boards: this.boards.length,
          items: items.length,
          boardNames: this.boards.map((b) => b.title),
        },
      }
    } catch (error) {
      return {
        id: `monday-com-${userId}`,
        provider: this.config.provider,
        type: this.config.type,
        config: this.config,
        connected: true,
        lastSync: new Date().toISOString(),
        syncStatus: 'error',
        error: error instanceof Error ? error.message : 'Sync failed',
      }
    }
  }

  async disconnect(userId: string): Promise<boolean> {
    try {
      this.accessToken = null
      this.boards = []
      return true
    } catch (error) {
      console.error('Failed to disconnect Monday.com:', error)
      return false
    }
  }

  async handleWebhook(payload: any): Promise<void> {
    const event = payload?.event
    if (event === 'create' || event === 'update' || event === 'delete') {
      console.log(`Monday.com webhook: ${event} for item ${payload?.webhookData?.item_id || payload?.item_id}`)
    }
  }

  getCapabilities(): string[] {
    return [
      'Sync Monday.com items as tasks',
      'Create items in Monday.com boards',
      'Update item status automatically',
      'Assign items to team members',
      'Sync due dates with Monday.com items',
      'Track board progress',
    ]
  }

  async createItem(boardId: string, groupTitle: string, itemName: string, columnValues?: Record<string, any>): Promise<MondayItem> {
    const token = this.accessToken || '';
    const variables: any = {
      boardId,
      itemName,
      groupTitle,
    }
    if (columnValues) variables.columnValues = columnValues

    const response = await this.makeRequest('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `mutation($boardId: String!, $itemName: String!, $groupTitle: String!, $columnValues: JSON) {
          create_item(board_id: $boardId, group_title: $groupTitle, item_name: $itemName, column_values: $columnValues) {
            id
            name
            created_at
            state
          }
        }`,
        variables,
      }),
    })

    return response?.data?.create_item
  }

  async getBoards(): Promise<MondayBoard[]> {
    return this.boards
  }
}