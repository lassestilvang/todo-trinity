import { NextResponse } from 'next/server'
import { integrationConfigs } from '@/lib/integrations/base'
import { SlackIntegration } from '@/lib/integrations/slack'
import { GitHubIntegration } from '@/lib/integrations/github'
import { NotionIntegration } from '@/lib/integrations/notion'
import { ZapierIntegration } from '@/lib/integrations/zapier'

// GET /api/integrations - List connected integrations
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    // In a real app, this would fetch from database based on user/session
    // For now, return mock data
    const mockIntegrations = [
      {
        id: 'slack-user123',
        provider: 'slack',
        type: 'communication',
        config: integrationConfigs.find(c => c.id === 'slack')!,
        connected: true,
        lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        syncStatus: 'success',
        metadata: {
          team: 'Todo Trinity Team',
          user: 'john.doe',
          url: 'https://todotrinity.slack.com'
        }
      },
      {
        id: 'github-user123',
        provider: 'github',
        type: 'project_management',
        config: integrationConfigs.find(c => c.id === 'github')!,
        connected: true,
        lastSync: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        syncStatus: 'success',
        metadata: {
          user: 'johndoe',
          avatar: 'https://avatars.githubusercontent.com/u/123456?v=4',
          installations: 2,
          has_issue_scope: true
        }
      }
    ]

    if (type) {
      const filtered = mockIntegrations.filter(i => i.type === type)
      return NextResponse.json({ integrations: filtered })
    }

    return NextResponse.json({ integrations: mockIntegrations })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    )
  }
}

// POST /api/integrations - Connect a new integration
export async function POST(request: Request) {
  try {
    const { provider, credentials } = await request.json()

    if (!provider || !credentials) {
      return NextResponse.json(
        { error: 'Provider and credentials are required' },
        { status: 400 }
      )
    }

    // Find the integration config
    const config = integrationConfigs.find(c => c.id === provider || c.provider === provider)
    if (!config) {
      return NextResponse.json(
        { error: `Integration ${provider} not supported` },
        { status: 400 }
      )
    }

    let integrationInstance
    switch (provider) {
      case 'slack':
        integrationInstance = new SlackIntegration(config)
        break
      case 'github':
        integrationInstance = new GitHubIntegration(config)
        break
      case 'notion':
        integrationInstance = new NotionIntegration(config)
        break
      case 'zapier':
        integrationInstance = new ZapierIntegration(config)
        break
      default:
        return NextResponse.json(
          { error: `Integration ${provider} not implemented` },
          { status: 501 }
        )
    }

    // Authenticate with the integration
    const integration = await integrationInstance.authenticate('user123', credentials)

    // In a real app, save to database
    // For now, return the integration
    return NextResponse.json({ integration }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to connect integration' },
      { status: 400 }
    )
  }
}

// DELETE /api/integrations - Disconnect an integration
export async function DELETE(request: Request) {
  try {
    const { provider } = await request.json()

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      )
    }

    // In a real app, revoke tokens and delete from database
    // For now, return success
    return NextResponse.json({ message: `Integration ${provider} disconnected successfully` })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect integration' },
      { status: 400 }
    )
  }
}

// POST /api/integrations/:provider/sync - Sync a specific integration
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider parameter is required' },
        { status: 400 }
      )
    }

    // Find the integration config
    const config = integrationConfigs.find(c => c.id === provider || c.provider === provider)
    if (!config) {
      return NextResponse.json(
        { error: `Integration ${provider} not supported` },
        { status: 400 }
      )
    }

    let integrationInstance
    switch (provider) {
      case 'slack':
        integrationInstance = new SlackIntegration(config)
        break
      case 'github':
        integrationInstance = new GitHubIntegration(config)
        break
      case 'notion':
        integrationInstance = new NotionIntegration(config)
        break
      case 'zapier':
        integrationInstance = new ZapierIntegration(config)
        break
      default:
        return NextResponse.json(
          { error: `Integration ${provider} not implemented` },
          { status: 501 }
        )
    }

    // Sync the integration
    const integration = await integrationInstance.sync('user123')

    return NextResponse.json({ integration })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || `Failed to sync integration ${provider}` },
      { status: 500 }
    )
  }
}

// GET /api/integrations/available - List available integrations
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    let available = integrationConfigs
    if (type) {
      available = integrationConfigs.filter(c => c.type === type)
    }

    return NextResponse.json({ integrations: available })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch available integrations' },
      { status: 500 }
    )
  }
}