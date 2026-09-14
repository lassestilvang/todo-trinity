import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import {
  broadcastTaskCreate,
  broadcastTaskUpdate,
  broadcastTaskDelete,
  broadcastTaskComplete,
  broadcastTaskComment,
  broadcastPriorityChange,
  broadcastConflictDetected,
  broadcastUserJoined,
  broadcastUserLeft
} from '@/lib/realtime'

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
    const { type, task, taskId, oldPriority, newPriority, conflictId } = body

    switch (type) {
      case 'task_created':
        if (task && task.id) {
          broadcastTaskCreate(task, userId)
        }
        break

      case 'task_updated':
        if (task && task.id) {
          broadcastTaskUpdate(task, userId)
        }
        break

      case 'task_deleted':
        if (taskId) {
          broadcastTaskDelete(taskId, userId)
        }
        break

      case 'task_completed':
        if (task && task.id) {
          broadcastTaskComplete(task, userId)
        }
        break

      case 'task_commented':
        if (task && task.id) {
          broadcastTaskComment(task, userId)
        }
        break

      case 'priority_changed':
        if (taskId && oldPriority && newPriority) {
          broadcastPriorityChange(task || { id: taskId }, oldPriority, newPriority, userId)
        }
        break

      case 'conflict_detected':
        if (taskId) {
          broadcastConflictDetected(taskId, [taskId], userId)
        }
        break

      case 'user_joined':
        broadcastUserJoined(userId)
        break

      case 'user_left':
        broadcastUserLeft(userId)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid event type' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error broadcasting event:', error)
    return NextResponse.json(
      { error: 'Failed to broadcast event' },
      { status: 500 }
    )
  }
}