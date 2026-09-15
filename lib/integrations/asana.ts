"use client"

import { BaseIntegration, Integration, IntegrationConfig } from './base'

export interface AsanaProject {
  id: string
  name: string
  color: string | null
  workspace: { id: string; name: string }
  members: Array<{ id: string; name: string }>
}

export interface AsanaTask {
  id: string
  name: string
  notes: string
  assignee: { id: string; name: string } | null
  due_at: string | null
  status: 'incomplete' | 'completed' | 'incomplete'
  project: { id: string; name: string } | null
  tags: Array<{ id: string; name: string }>
  created_at: string
  modified_at: string
}

export class AsanaIntegration extends BaseIntegration {
  private accessToken: string | null = null
  private projects: AsanaProject[] = []

  constructor(config: IntegrationConfig) {
    super(config)
  }

  async authenticate(userId: string, credentials: Record<string, any>): Promise<Integration> {
    if (!credentials?.accessToken) {
      throw new Error('Asana access token is required')
    }

    this.accessToken = credentials.accessToken

    try {
      const [userResponse, projectsResponse] = await Promise.all([
        this.makeRequest('https://app.asana.com/api/1.0/users/me', {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json',
          },
        }),
        this.makeRequest('https://app.asana.com/api/1.0/projects?limit=100', {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json',
          },
        }),
      ])

      this.projects = projectsResponse.data || []

      return {
        id: `asana-${userId}`,
        provider: this.config.provider,
        type: this.config.type,
        config: this.config,
        connected: true,
        lastSync: new Date().toISOString(),
        syncStatus: 'success',
        metadata: {
          user: userResponse.name,
          email: userResponse.email,
          projects: this.projects.length,
        },
      }
    } catch (error) {
      throw new Error(`Asana authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async sync(userId: string): Promise<Integration> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Asana')
    }

    try {
      const tasks: AsanaTask[] = []

      for (const project of this.projects) {
        try {
          const response = await this.makeRequest(
            `https://app.asana.com/api/1.0/projects/${project.id}/tasks?limit=100`,
            {
              headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Accept': 'application/json',
              },
            }
          )
          tasks.push(...(response.data || []))
        } catch (error) {
          console.warn(`Failed to fetch tasks for project ${project.name}:`, error)
        }
      }

      return {
        id: `asana-${userId}`,
        provider: this.config.provider,
        type: this.config.type,
        config: this.config,
        connected: true,
        lastSync: new Date().toISOString(),
        syncStatus: 'success',
        metadata: {
          projects: this.projects.length,
          tasks: tasks.length,
          projectNames: this.projects.map((p) => p.name),
        },
      }
    } catch (error) {
      return {
        id: `asana-${userId}`,
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
      this.projects = []
      return true
    } catch (error) {
      console.error('Failed to disconnect Asana:', error)
      return false
    }
  }

  async handleWebhook(payload: any): Promise<void> {
    const event = payload?.event
    if (event === 'created' || event === 'changed' || event === 'deleted') {
      console.log(`Asana webhook: ${event} for task ${payload?.task?.gid}`)
    }
  }

  getCapabilities(): string[] {
    return [
      'Sync Asana tasks as tasks',
      'Create tasks in Asana projects',
      'Update task status automatically',
      'Assign tasks to team members',
      'Sync due dates with Asana tasks',
      'Track project progress',
    ]
  }

  async createTask(taskData: {
    name: string
    notes?: string
    projectId: string
    assigneeId?: string
    dueDate?: string
  }): Promise<AsanaTask> {
    const body: any = {
      name: taskData.name,
      notes: taskData.notes || '',
      projects: [taskData.projectId],
    }
    if (taskData.assigneeId) body.assignee = taskData.assigneeId
    if (taskData.dueDate) body.due_at = taskData.dueDate

    const response = await this.makeRequest('https://app.asana.com/api/1.0/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: body }),
    })

    return response.data
  }

  async getProjects(): Promise<AsanaProject[]> {
    return this.projects
  }
}