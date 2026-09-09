import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/search/saved - Get all saved searches for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const savedSearches = await prisma.userSetting.findMany({
      where: {
        userId,
        key: { startsWith: 'saved_search_' }
      }
    })

    const searches = savedSearches.map(s => JSON.parse(s.value))

    return NextResponse.json({ searches })
  } catch (error) {
    console.error('Error fetching saved searches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved searches', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/search/saved - Save a new search filter
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const body = await request.json()
    const { name, filters, query } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Name is required' },
        { status: 400 }
      )
    }

    const searchData = {
      name,
      filters: filters || {},
      query: query || '',
      savedAt: new Date().toISOString()
    }

    const searchKey = `saved_search_${name.toLowerCase().replace(/\s+/g, '_')}`

    await prisma.userSetting.upsert({
      where: {
        userId_key: {
          userId,
          key: searchKey
        }
      },
      update: {
        value: JSON.stringify(searchData)
      },
      create: {
        userId,
        key: searchKey,
        value: JSON.stringify(searchData)
      }
    })

    return NextResponse.json({ search: searchData }, { status: 201 })
  } catch (error) {
    console.error('Error saving search:', error)
    return NextResponse.json(
      { error: 'Failed to save search', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/search/saved - Delete a saved search
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const name = searchParams.get('name')

    if (!name) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Search name is required' },
        { status: 400 }
      )
    }

    const searchKey = `saved_search_${name.toLowerCase().replace(/\s+/g, '_')}`

    await prisma.userSetting.deleteMany({
      where: {
        userId,
        key: searchKey
      }
    })

    return NextResponse.json({ message: 'Saved search deleted successfully' })
  } catch (error) {
    console.error('Error deleting saved search:', error)
    return NextResponse.json(
      { error: 'Failed to delete saved search', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}