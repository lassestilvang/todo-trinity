import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/comments?taskId=xxx - Get comments for a task
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to view comments' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'taskId parameter is required' },
        { status: 400 }
      )
    }

    // Verify user has access to the task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { userId },
          { list: { userId } },
          { workspace: { members: { some: { userId } } } }
        ]
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have access to this task' },
        { status: 403 }
      )
    }

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, image: true }
        },
        replies: {
          include: {
            user: {
              select: { id: true, name: true, image: true }
            }
          }
        },
        mentions: {
          include: {
            user: {
              select: { id: true, name: true, image: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/comments - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to create comments' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    let body: any

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }

    const { taskId, content, parentId } = body

    if (!taskId || !content) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'taskId and content are required' },
        { status: 400 }
      )
    }

    // Verify user has access to the task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { userId },
          { list: { userId } },
          { workspace: { members: { some: { userId } } } }
        ]
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have access to this task' },
        { status: 403 }
      )
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        userId,
        parentId: parentId || undefined,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true }
        }
      }
    })

    // Extract mentions from content and create Mention records + notifications
    const mentionPattern = /@(\w+)/g
    const mentionedUsernames: string[] = []
    let match
    while ((match = mentionPattern.exec(content)) !== null) {
      mentionedUsernames.push(match[1])
    }

    if (mentionedUsernames.length > 0) {
      // Find users by name (case-insensitive partial match)
      const mentionedUsers = await prisma.user.findMany({
        where: {
          OR: mentionedUsernames.map(username => ({
            name: { contains: username, mode: 'insensitive' }
          }))
        },
        select: { id: true, name: true }
      })

      // Create Mention records and notifications for each mentioned user
      for (const mentionedUser of mentionedUsers) {
        if (mentionedUser.id === userId) continue // Don't notify self

        await prisma.mention.create({
          data: {
            commentId: comment.id,
            userId: mentionedUser.id,
            read: false
          }
        })

        await prisma.notification.create({
          data: {
            title: `${session.user.name || 'Someone'} mentioned you in a comment`,
            message: `${session.user.name || 'Someone'} mentioned you in "${task.title}"`,
            type: 'mention',
            data: JSON.stringify({
              taskId,
              commentId: comment.id,
              mentionedBy: userId,
              mentionedByName: session.user.name
            }),
            userId: mentionedUser.id,
            read: false
          }
        })
      }
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

