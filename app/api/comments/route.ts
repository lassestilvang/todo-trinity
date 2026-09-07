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

    // TODO: Extract mentions from content and create Mention records
    // TODO: Send notifications for mentions
    // TODO: Broadcast comment creation via realtime

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT /api/comments/[id] - Update a comment
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to update comments' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { id } = params

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }

    const { content } = body

    // Verify comment exists and user owns it
    const comment = await prisma.comment.findFirst({
      where: {
        id,
        userId
      }
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Comment not found or you do not have permission to update it' },
        { status: 404 }
      )
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        user: {
          select: { id: true, name: true, image: true }
        }
      }
    })

    // TODO: Broadcast comment update via realtime

    return NextResponse.json({ comment: updatedComment })
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json(
      { error: 'Failed to update comment', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/comments/[id] - Delete a comment
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to delete comments' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { id } = params

    // Verify comment exists and user owns it
    const comment = await prisma.comment.findFirst({
      where: {
        id,
        userId
      }
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Comment not found or you do not have permission to delete it' },
        { status: 404 }
      )
    }

    await prisma.comment.delete({
      where: { id }
    })

    // TODO: Broadcast comment deletion via realtime

    return NextResponse.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}