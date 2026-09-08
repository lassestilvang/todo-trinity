import { NextResponse } from 'next/server'
import { integrationConfigs } from '@/lib/integrations/base'

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