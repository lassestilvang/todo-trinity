import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/admin/check - Check if current user is admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { workspaces: true }
    })

    const isAdmin = user?.workspaces?.some(member =>
      member.role === 'ADMIN' || member.role === 'OWNER'
    )

    return NextResponse.json({
      isAdmin: isAdmin || false,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      workspaceRoles: user?.workspaces.map(w => ({ id: w.id, name: w.name, role: w.role })) || []
    })
  } catch (error) {
    console.error('Error checking admin status:', error)
    return NextResponse.json(
      { error: 'Failed to check admin status', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}