"use client"

import { BaseIntegration, Integration, IntegrationConfig, integrationConfigs } from './base'

export interface GitHubIssue {
  id: number
  number: number
  title: string
  body: string
  state: 'open' | 'closed'
  labels: Array<{ name: string; color: string }>
  assignees: Array<{ login: string; id: number }>
  created_at: string
  updated_at: string
  due_date?: string
}

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  owner: { login: string }
  private: boolean
  html_url: string
}

export class GitHubIntegration extends BaseIntegration {
  private accessToken: string | null = null
  private installations: Array<{
    id: number
    account: { login: string }
    selected_repositories: string[]
  }> = []

  constructor(config: IntegrationConfig) {
    super(config)
  }

  async authenticate(userId: string, credentials: Record<string, any>): Promise<Integration> {
    if (!credentials?.accessToken) {
      throw new Error('GitHub access token is required')
    }

    this.accessToken = credentials.accessToken

    try {
      // Get user info and token scope
      const [userResponse, scopesResponse] = await Promise.all([
        this.makeRequest('https://api.github.com/user', {
          headers: {
            'Authorization': `token ${this.accessToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }),
        this.makeRequest('https://api.github.com/user/scopes', {
          headers: {
            'Authorization': `token ${this.accessToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        })
      ])

      // Check if user has access to installations (for org access)
      let installations = []
      try {
        const installResponse = await this.makeRequest('https://api.github.com/user/installations', {
          headers: {
            'Authorization': ` Bearer ${this.accessToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        })
        installations = installResponse.installations || []
      } catch (e) {
        // Not an installation token, that's okay
      }

      this.installations = installations

      return {
        id: `github-${userId}`,
        provider: this.config.provider,
        type: this.config.type,
        config: this.config,
        connected: true,
        lastSync: new Date().toISOString(),
        syncStatus: 'success',
        metadata: {
          user: userResponse.login,
          avatar: userResponse.avatar_url,
          installations: installations.length,
          has_issue_scope: scopesResponse.includes('repo') || scopesResponse.includes('public_repo')
        }
      }
    } catch (error) {
      throw new Error(`GitHub authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async sync(userId: string): Promise<Integration> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with GitHub')
    }

    try {
      // Sync user repositories and issues
      const [repos, issues] = await Promise.all([
        this.getRepositories(),
        this.getIssues()
      ])

      return {
        id: `github-${userId}`,
        provider: this.config.provider,
        type: this.config.type,
        config: this.config,
        connected: true,
        lastSync: new Date().toISOString(),
        syncStatus: 'success',
        metadata: {
          repositories: repos,
          issues: issues.slice(0, 50), // Last 50 issues
          totalRepositories: repos.length,
          totalIssues: issues.length
        }
      }
    } catch (error) {
      return {
        id: `github-${userId}`,
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
    try {
      this.accessToken = null
      this.installations = []
      return true
    } catch (error) {
      console.error('Failed to disconnect GitHub:', error)
      return false
    }
  }

  async handleWebhook(payload: any): Promise<void> {
    // Handle GitHub webhooks (issues, pull requests, etc.)
    const event = payload.action

    if (event === 'opened' || event === 'reopened') {
      handleIssueEvent(payload, event)
    } else if (event === 'closed') {
      handleIssueClosed(payload)
    } else if (event === 'edited') {
      handleIssueEdited(payload)
    }
  }

  getCapabilities(): string[] {
    return [
      'Sync GitHub issues as tasks',
      'Create issues from tasks',
      'Update issue status automatically',
      'Link tasks to PRs and branches',
      'Assign issues to team members',
      'Sync due dates with milestones'
    ]
  }

  private async getRepositories(): Promise<GitHubRepository[]> {
    const repos: GitHubRepository[] = []
    let page = 1
    const perPage = 100

    while (true) {
      try {
        const response = await this.makeRequest(
          `https://api.github.com/user/repos?type=owner&per_page=${perPage}&page=${page}`,
          {
            headers: {
              'Authorization': `token ${this.accessToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        )

        if (response.length === 0) break

        repos.push(...response)
        page++
      } catch (error) {
        break
      }
    }

    return repos
  }

  private async getIssues(): Promise<GitHubIssue[]> {
    const issues: GitHubIssue[] = []

    for (const repo of this.installations) {
      const repoName = repo.account.login
      try {
        const response = await this.makeRequest(
          `https://api.github.com/repos/${repoName}/issues?state=all&per_page=100`,
          {
            headers: {
              'Authorization': `token ${this.accessToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        )

        issues.push(...response)
      } catch (error) {
        console.warn(`Failed to fetch issues for ${repoName}:`, error)
      }
    }

    return issues
  }

  async createTaskFromIssue(issueData: {
    title: string
    description: string
    repositoryId: string
    labels?: string[]
    assignees?: string[]
    dueDate?: string
  }): Promise<GitHubIssue> {
    const [owner, repo] = repositoryId.split('/')

    const issue = await this.makeRequest(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${this.accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        title: issueData.title,
        body: issueData.description,
        labels: issueData.labels || [],
        assignees: issueData.assignees || [],
        due_date: issueData.dueDate
      })
    })

    return issue
  }

  async linkTaskToIssue(taskId: string, issueNumber: number, repositoryId: string): Promise<void> {
    // Would store the link in the database
    console.log(`Linked task ${taskId} to issue #${issueNumber} in ${repositoryId}`)
  }
}

function handleIssueEvent(payload: any, event: string) {
  const issue = payload.issue
  console.log(`GitHub issue ${event}: #${issue.number} - ${issue.title}`)
  // Would create/update local task
}

function handleIssueClosed(payload: any) {
  const issue = payload.issue
  console.log(`GitHub issue closed: #${issue.number} - ${issue.title}`)
  // Would mark local task as completed
}

function handleIssueEdited(payload: any) {
  const issue = payload.issue
  console.log(`GitHub issue edited: #${issue.number} - ${issue.title}`)
  // Would update local task
}

export { integrationConfigs }