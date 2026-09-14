import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// PUT /api/comments/[id] - Update a comment
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to update comments' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { id } = await context.params

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
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to delete comments' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { id } = await context.params

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