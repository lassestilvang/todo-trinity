import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

/**
 * Authentication middleware - requires sign-in
 */
export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    const url = new URL('/auth/signin', request.url)
    url.searchParams.set('callbackUrl', request.url)
    return new Response(null, { status: 302, headers: { Location: url.toString() } })
  }

  return { session, user: session.user }
}

/**
 * Optional authentication middleware - user may or may not be signed in
 */
export async function optionalAuth(request: NextRequest) {
  const session = await getServerSession(authOptions)
  return { session, user: session?.user }
}

/**
 * Role-based authorization middleware
 * @param allowedRoles - Roles that are permitted to access this route
 */
export async function requireRole(request: NextRequest, allowedRoles: string[]) {
  const { session, user } = await optionalAuth(request)

  if (!session?.user?.id) {
    const url = new URL('/auth/signin', request.url)
    url.searchParams.set('callbackUrl', request.url)
    return new Response(null, { status: 302, headers: { Location: url.toString() } })
  }

  if (!allowedRoles.includes(user.role || 'user')) {
    return new Response(
      JSON.stringify({ error: 'Forbidden: Insufficient permissions' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return { session, user }
}

export type { NextRequest }