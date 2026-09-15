import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: { select: { role: true } } },
    })

    const userRoles = user?.roles?.map(r => r.role) || []
    const isAdmin = userRoles.includes('admin')
    const isManager = userRoles.includes('manager')

    if (!isAdmin && !isManager) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    // Build where clause for search
    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          roles: { select: { role: true } },
          createdAt: true,
          _count: {
            select: {
              tasks: true,
              comments: true,
              notifications: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can modify users
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: { select: { role: true } } },
    })

    const userRoles = user?.roles?.map(r => r.role) || []
    const isAdmin = userRoles.includes('admin')

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, role, name, email } = body

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['admin', 'manager', 'user', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Update the user role through UserRole relation
    if (role === 'admin') {
      // Create or update admin role
      const adminRole = await prisma.role.upsert({
        where: { name: 'admin' },
        update: {},
        create: {
          name: 'admin',
          description: 'Administrator role',
          permissions: []
        },
      })

      await prisma.userRole.upsert({
        where: { userId_roleId: { userId, roleId: adminRole.id } },
        update: {},
        create: { userId, roleId: adminRole.id },
      })
    } else if (['manager', 'user', 'viewer'].includes(role)) {
      // For other roles, ensure they exist
      const roleName = role.charAt(0).toUpperCase() + role.slice(1)
      const existingRole = await prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: {
          name: roleName,
          description: `${roleName} role`,
          permissions: []
        },
      })

      await prisma.userRole.upsert({
        where: { userId_roleId: { userId, roleId: existingRole.id } },
        update: {},
        create: { userId, roleId: existingRole.id },
      })
    } else {
      // Clean up any existing roles if invalid role provided
      await prisma.userRole.deleteMany({
        where: { userId },
      })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name, email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
      include: {
        roles: {
          select: { role: true },
        },
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can delete users
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: { select: { role: true } } },
    })

    const userRoles = user?.roles?.map(r => r.role) || []
    const isAdmin = userRoles.includes('admin')

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}