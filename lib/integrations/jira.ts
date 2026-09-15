"use client"

import { BaseIntegration, Integration, IntegrationConfig } from './base'

export interface JiraIssue {
  id: string
  key: string
  summary: string
  description: string
  status: {
    name: string
    id: string
    iconUrl: string
  }
  priority: {
    name: string
    id: string
    iconUrl: string
  }
  assignee: {
    name: string
    email: string
    displayName: string
    avatarUrl: string
  } | null
  reporter: {
    name: string
    email: string
    displayName: string
    avatarUrl: string
  }
  created: string
  updated: string
  resolved: string | null
  dueDate: string | null
  labels: string[]
  components: Array<{ name: string }>
  fixVersions: Array<{ name: string }>
  customFields: Record<string, any>
}

export interface JiraProject {
  id: string
  key: string
  name: string
  description: string
  lead: {
    name: string
    email: string
    displayName: string
  }
  url: string
  projectTypeKey: 'software' | 'service_desk' | 'business'
  assigneeType: 'PROJECT_LEAD' | 'UNASSIGNED' | 'RANDOM'
  permissionScheme: { id: string }
}

export interface JiraSprint {
  id: number
  name: string
  state: 'future' | 'active' | 'closed'
  startDate: string
  endDate: string
  goal: string
}

export class JiraIntegration extends BaseIntegration {
  private accessToken: string | null = null
  private baseUrl: string | null = null
  private projects: JiraProject[] = []

  constructor(config: IntegrationConfig) {
    super(config)
  }

  async authenticate(userId: string, credentials: Record<string, any>): Promise<Integration> {
    if (!credentials?.baseUrl) {
      throw new Error('Jira base URL is required')
    }
    if (!credentials?.accessToken) {
      throw new Error('Jira access token is required')
    }

    this.baseUrl = credentials.baseUrl
    this.accessToken = credentials.accessToken

    try {
      const [meResponse, projectsResponse] = await Promise.all([
        this.makeRequest(`${this.baseUrl}/rest/api/3/myself`, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json',
          },
        }),
        this.makeRequest(`${this.baseUrl}/rest/api/3/project/search?expand=lead,permissionScheme`, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json',
          },
        }),
      ])

      this.projects = projectsResponse || []

      return {
        id: `jira-${userId}`,
        provider: this.config.provider,
        type: this.config.type,
        config: this.config,
        connected: true,
        lastSync: new Date().toISOString(),
        syncStatus: 'success',
        metadata: {
          user: meResponse?.name,
          email: meResponse?.email,
          projects: this.projects.length,
        },
      }
    } catch (error) {
      throw new Error(`Jira authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async sync(userId: string): Promise<Integration> {
    if (!this.accessToken || !this.baseUrl) {
      throw new Error('Not authenticated with Jira')
    }

    try {
      const issues: JiraIssue[] = []
      const sprints: JiraSprint[] = []

      for (const project of this.projects) {
        try {
          const [projectIssues, projectSprints] = await Promise.all([
            this.getIssuesForProject(project.id),
            this.getSprints(project.id),
          ])
          issues.push(...projectIssues)
          sprints.push(...projectSprints)
        } catch (error) {
          console.warn(`Failed to fetch data for project ${project.name}:`, error)
        }
      }

      return {
        id: `jira-${userId}`,
        provider: this.config.provider,
        type: this.config.type,
        config: this.config,
        connected: true,
        lastSync: new Date().toISOString(),
        syncStatus: 'success',
        metadata: {
          projects: this.projects.length,
          issues: issues.length,
          sprints: sprints.length,
          projectNames: this.projects.map((p) => p.name),
        },
      }
    } catch (error) {
      return {
        id: `jira-${userId}`,
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
      this.baseUrl = null
      this.projects = []
      return true
    } catch (error) {
      console.error('Failed to disconnect Jira:', error)
      return false
    }
  }

  async handleWebhook(payload: any): Promise<void> {
    const event = payload?.webhookEvent
    if (event === 'issue.created' || event === 'issue.updated' || event === 'issue.deleted') {
      console.log(`Jira webhook: ${event} for issue ${payload?.issue?.key}`)
    }
  }

  getCapabilities(): string[] {
    return [
      'Sync Jira issues as tasks',
      'Create issues in Jira projects',
      'Update issue status automatically',
      'Assign issues to users',
      'Sync due dates with Jira issues',
      'Track project progress with sprints',
      'Map Jira custom fields to tasks',
    ]
  }

  async createIssue(projectKey: string, issueData: {
    summary: string
    description: string
    issueType: string
    priority?: string
    assignee?: string
    reporter?: string
    dueDate?: string
    labels?: string[]
    components?: string[]
  }): Promise<JiraIssue> {
    const body: any = {
      summary: issueData.summary,
      description: {
        type: 'jira',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: issueData.description,
              },
            ],
          },
        ],
      },
      issuetype: {
        name: issueData.issueType,
      },
    }

    if (issueData.priority) {
      body.priority = { name: issueData.priority }
    }

    if (issueData.assignee) {
      body.assignee = { name: issueData.assignee }
    }

    if (issueData.reporter) {
      body.reporter = { name: issueData.reporter }
    }

    if (issueData.dueDate) {
      body.duedate = issueData.dueDate
    }

    if (issueData.labels && issueData.labels.length > 0) {
      body.labels = issueData.labels
    }

    const response = await this.makeRequest(
      `${this.baseUrl}/rest/api/3/issue`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...body, project: { key: projectKey } }),
      }
    )

    return response
  }

  async getIssuesForProject(projectId: string): Promise<JiraIssue[]> {
    const response = await this.makeRequest(
      `${this.baseUrl}/rest/api/3/search?jql=project=${projectId}&maxResults=100&expand=status,priority,assignee,reporter`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json',
        },
      }
    )

    return response.issues || []
  }

  async getSprints(projectId: string): Promise<JiraSprint[]> {
    const response = await this.makeRequest(
      `${this.baseUrl}/rest/agile/1.0/board/${projectId}/sprint?state=active,future,closed`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json',
        },
      }
    )

    return response.values || []
  }

  async getProjects(): Promise<JiraProject[]> {
    return this.projects
  }
}