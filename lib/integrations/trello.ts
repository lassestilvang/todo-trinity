"use client"

import { BaseIntegration, Integration, IntegrationConfig } from './base'

export interface TrelloBoard {
  id: string
  name: string
  desc: string
  closed: boolean
  prefs: {
    permissionLevel: 'private' | 'team' | 'public'
    voting: 'disabled' | 'members' | 'observers' | 'everyone'
  }
  members: Array<{ id: string; fullName: string; username: string }>
}

export interface TrelloList {
  id: string
  name: string
  closed: boolean
  pos: number
  board: string
}

export interface TrelloCard {
  id: string
  name: string
  desc: string
  idList: string
  idBoard: string
  idMembers: string[]
  due: string | null
  dueComplete: boolean
  state: 'incomplete' | 'complete' | 'closed'
  createdAt: string
  updatedAt: string
  labels: TrelloLabel[]
}

export interface TrelloLabel {
  id: string
  name: string
  color: 'green' | 'yellow' | 'orange' | 'red' | 'purple' | 'blue' | 'sky' | 'pink' | 'black' | 'white' | null
}

export class TrelloIntegration extends BaseIntegration {
  private accessToken: string | null = null
  private apiKey: string | null = null
  private boards: TrelloBoard[] = []

  constructor(config: IntegrationConfig) {
    super(config)
  }

  async authenticate(userId: string, credentials: Record<string, any>): Promise<Integration> {
    if (!credentials?.accessToken) {
      throw new Error('Trello access token is required')
    }

    this.accessToken = credentials.accessToken
    this.apiKey = credentials.apiKey || process.env.NEXT_PUBLIC_TRELLO_API_KEY

    try {
      // Get user info and boards
      const [meResponse, boardsResponse] = await Promise.all([
        this.makeRequest('https://api.trello.com/1/members/me?key=' + (this.apiKey || '') + '&token=' + this.accessToken, {
          headers: {
            'Accept': 'application/json',
          },
        }),
        this.makeRequest('https://api.trello.com/1/members/me/boards?key=' + (this.apiKey || '') + '&token=' + this.accessToken + '&fields=name,desc,closed,prefs,members', {
          headers: {
            'Accept': 'application/json',
          },
        }),
      ])

      this.boards = boardsResponse || []

      return {
        id: `trello-${userId}`,
        provider: this.config.provider,
        type: this.config.type,
        config: this.config,
        connected: true,
        lastSync: new Date().toISOString(),
        syncStatus: 'success',
        metadata: {
          user: meResponse?.fullName || meResponse?.username,
          username: meResponse?.username,
          boards: this.boards.length,
        },
      }
    } catch (error) {
      throw new Error(`Trello authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async sync(userId: string): Promise<Integration> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Trello')
    }

    try {
      const cards: TrelloCard[] = []

      for (const board of this.boards) {
        try {
          const response = await this.makeRequest(
            `https://api.trello.com/1/boards/${board.id}/cards?key=${this.apiKey}&token=${this.accessToken}&fields=name,desc,idList,idBoard,idMembers,due,dueComplete,createdAt,updatedAt,labels`,
            {
              headers: {
                'Accept': 'application/json',
              },
            }
          )
          cards.push(...response)
        } catch (error) {
          console.warn(`Failed to fetch cards for board ${board.name}:`, error)
        }
      }

      return {
        id: `trello-${userId}`,
        provider: this.config.provider,
        type: this.config.type,
        config: this.config,
        connected: true,
        lastSync: new Date().toISOString(),
        syncStatus: 'success',
        metadata: {
          boards: this.boards.length,
          cards: cards.length,
          boardNames: this.boards.map((b) => b.name),
        },
      }
    } catch (error) {
      return {
        id: `trello-${userId}`,
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
      this.apiKey = null
      this.boards = []
      return true
    } catch (error) {
      console.error('Failed to disconnect Trello:', error)
      return false
    }
  }

  async handleWebhook(payload: any): Promise<void> {
    // Trello webhooks don't have a standard webhook format in the same way
    // They send a callback to a URL with the action
    console.log('Trello webhook received:', payload)
  }

  getCapabilities(): string[] {
    return [
      'Sync Trello cards as tasks',
      'Create cards in Trello lists',
      'Update card status automatically',
      'Assign cards to members',
      'Sync due dates with Trello cards',
      'Track board progress with labels',
    ]
  }

  async createCard(cardData: {
    name: string
    desc: string
    listId: string
    idMembers?: string[]
    due?: string
    labels?: string[]
  }): Promise<TrelloCard> {
    const params = new URLSearchParams({
      key: this.apiKey || '',
      token: this.accessToken || '',
      idList: cardData.listId,
      name: cardData.name,
      desc: cardData.desc,
    })

    if (cardData.idMembers && cardData.idMembers.length > 0) {
      params.set('idMembers', cardData.idMembers.join(','))
    }
    if (cardData.due) {
      params.set('due', cardData.due)
    }
    if (cardData.labels && cardData.labels.length > 0) {
      params.set('idLabels', cardData.labels.join(','))
    }

    const response = await fetch(`https://api.trello.com/1/cards?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Trello API error: ${response.status}`)
    }

    return response.json()
  }

  async getBoards(): Promise<TrelloBoard[]> {
    return this.boards
  }
}