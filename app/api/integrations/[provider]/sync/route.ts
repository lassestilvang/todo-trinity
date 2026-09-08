import { NextResponse } from 'next/server'
import { integrationConfigs } from '@/lib/integrations/base'

// POST /api/integrations/[provider]/sync - Sync a specific integration
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const syncType = searchParams.get('type') || 'full'

    // Find the integration config by provider from the URL path
    const { pathname } = new URL(request.url)
    const provider = pathname.split('/')[3]

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

    // Import the appropriate integration class
    let integrationInstance
    switch (provider) {
      case 'slack':
        integrationInstance = new (await import('@/lib/integrations/slack')).SlackIntegration(config)
        break
      case 'github':
        integrationInstance = new (await import('@/lib/integrations/github')).GitHubIntegration(config)
        break
      case 'notion':
        integrationInstance = new (await import('@/lib/integrations/notion')).NotionIntegration(config)
        break
      case 'zapier':
        integrationInstance = new (await import('@/lib/integrations/zapier')).ZapierIntegration(config)
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