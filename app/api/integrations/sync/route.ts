import { NextResponse } from 'next/server'
import { integrationConfigs } from '@/lib/integrations/base'
import { SlackIntegration } from '@/lib/integrations/slack'
import { GitHubIntegration } from '@/lib/integrations/github'
import { NotionIntegration } from '@/lib/integrations/notion'
import { ZapierIntegration } from '@/lib/integrations/zapier'
import { JiraIntegration } from '@/lib/integrations/jira'
import { AsanaIntegration } from '@/lib/integrations/asana'
import { MondayIntegration } from '@/lib/integrations/monday-com'
import { TrelloIntegration } from '@/lib/integrations/trello'

// POST /api/integrations/sync - Sync an integration
export async function POST(request: Request) {
  try {
    const { provider, credentials } = await request.json()

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      )
    }

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
      case 'jira':
        integrationInstance = new JiraIntegration(config)
        break
      case 'asana':
        integrationInstance = new AsanaIntegration(config)
        break
      case 'monday-com':
        integrationInstance = new MondayIntegration(config)
        break
      case 'trello':
        integrationInstance = new TrelloIntegration(config)
        break
      default:
        return NextResponse.json(
          { error: `Integration ${provider} not implemented` },
          { status: 501 }
        )
    }

    const integration = await integrationInstance.sync('user123')
    return NextResponse.json({ integration })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to sync integration' },
      { status: 500 }
    )
  }
}

// GET /api/integrations/sync - Get sync status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      provider,
      syncStatus: 'idle',
      lastSync: null,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get sync status' },
      { status: 500 }
    )
  }
}