import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TaskStatus, Priority } from '@/src/types/index'
import { DecompositionResult, DecomposedSubTask } from '@/lib/ai/types'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to access AI features' },
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

    const { title, description, priority, dueDate, labels, subtasks } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Task title is required' },
        { status: 400 }
      )
    }

    // Generate AI decomposition
    const decomposition = await generateDecomposition(
      title,
      description,
      priority || Priority.NORMAL,
      userId
    )

    return NextResponse.json({
      success: true,
      decomposition,
      createdAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error decomposing task with AI:', error)
    return NextResponse.json(
      { error: 'Failed to decompose task', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to access AI features' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const searchParams = new URL(request.url).searchParams
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'taskId query parameter is required' },
        { status: 400 }
      )
    }

    // Get existing task
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Not found', message: 'Task not found' },
        { status: 404 }
      )
    }

    // Generate decomposition for existing task
    const decomposition = await generateDecomposition(
      task.title,
      task.description || undefined,
      task.priority as Priority,
      userId
    )

    return NextResponse.json({
      success: true,
      decomposition,
      taskId,
      createdAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching decomposition:', error)
    return NextResponse.json(
      { error: 'Failed to fetch decomposition', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function generateDecomposition(
  title: string,
  description: string | undefined,
  priority: Priority,
  userId: string
): Promise<DecompositionResult> {
  // In production, this would call an actual AI service like OpenAI/Claude
  // For now, we simulate sophisticated decomposition based on task content

  const keywords = title.toLowerCase() + (description || '').toLowerCase()
  const subtasks: DecomposedSubTask[] = []

  // Smart decomposition based on content analysis
  if (keywords.includes('plan') || keywords.includes('organize')) {
    subtasks.push(
      { title: 'Define objectives and scope', estimatedMinutes: 30, priority: Priority.HIGH },
      { title: 'Create timeline and milestones', estimatedMinutes: 45, priority: Priority.HIGH },
      { title: 'Identify resources and budget', estimatedMinutes: 30, priority: Priority.NORMAL },
      { title: 'Assign responsibilities', estimatedMinutes: 20, priority: Priority.NORMAL },
      { title: 'Set up tracking and communication', estimatedMinutes: 15, priority: Priority.LOW }
    )
  } else if (keywords.includes('write') || keywords.includes('draft') || keywords.includes('create') || keywords.includes('compose')) {
    subtasks.push(
      { title: 'Research and gather information', estimatedMinutes: 45, priority: Priority.HIGH },
      { title: 'Create outline/structure', estimatedMinutes: 30, priority: Priority.HIGH },
      { title: 'Write main content', estimatedMinutes: 120, priority: Priority.HIGH },
      { title: 'Edit and refine', estimatedMinutes: 60, priority: Priority.NORMAL },
      { title: 'Add visuals/illustrations', estimatedMinutes: 40, priority: Priority.LOW },
      { title: 'Review and finalize', estimatedMinutes: 30, priority: Priority.NORMAL }
    )
  } else if (keywords.includes('design') || keywords.includes('ui') || keywords.includes('ux') || keywords.includes('interface')) {
    subtasks.push(
      { title: 'User research and requirements', estimatedMinutes: 60, priority: Priority.HIGH },
      { title: 'Create wireframes and mockups', estimatedMinutes: 90, priority: Priority.HIGH },
      { title: 'Develop interactive prototype', estimatedMinutes: 120, priority: Priority.HIGH },
      { title: 'User testing and feedback', estimatedMinutes: 60, priority: Priority.NORMAL },
      { title: 'Visual design and styling', estimatedMinutes: 90, priority: Priority.HIGH },
      { title: 'Developer handoff', estimatedMinutes: 30, priority: Priority.NORMAL }
    )
  } else if (keywords.includes('code') || keywords.includes('develop') || keywords.includes('build') || keywords.includes('implement')) {
    subtasks.push(
      { title: 'Requirements analysis', estimatedMinutes: 45, priority: Priority.HIGH },
      { title: 'Architecture design', estimatedMinutes: 60, priority: Priority.HIGH },
      { title: 'Core implementation', estimatedMinutes: 180, priority: Priority.HIGH },
      { title: 'Unit testing', estimatedMinutes: 90, priority: Priority.HIGH },
      { title: 'Integration testing', estimatedMinutes: 60, priority: Priority.NORMAL },
      { title: 'Code review and refactoring', estimatedMinutes: 90, priority: Priority.NORMAL },
      { title: 'Documentation', estimatedMinutes: 45, priority: Priority.NORMAL }
    )
  } else if (keywords.includes('meeting') || keywords.includes('presentation') || keywords.includes('report') || keywords.includes('proposal')) {
    subtasks.push(
      { title: 'Gather data and materials', estimatedMinutes: 60, priority: Priority.HIGH },
      { title: 'Create outline/agenda', estimatedMinutes: 30, priority: Priority.HIGH },
      { title: 'Build content/slides', estimatedMinutes: 90, priority: Priority.HIGH },
      { title: 'Stakeholder review', estimatedMinutes: 45, priority: Priority.NORMAL },
      { title: 'Finalize and distribute', estimatedMinutes: 30, priority: Priority.NORMAL }
    )
  } else if (keywords.includes('research') || keywords.includes('investigate') || keywords.includes('study')) {
    subtasks.push(
      { title: 'Define research scope', estimatedMinutes: 30, priority: Priority.HIGH },
      { title: 'Collect data/sources', estimatedMinutes: 90, priority: Priority.HIGH },
      { title: 'Analyze findings', estimatedMinutes: 60, priority: Priority.NORMAL },
      { title: 'Draw conclusions', estimatedMinutes: 45, priority: Priority.NORMAL },
      { title: 'Present recommendations', estimatedMinutes: 30, priority: Priority.LOW }
    )
  } else if (keywords.includes('setup') || keywords.includes('configure') || keywords.includes('install') || keywords.includes('deploy')) {
    subtasks.push(
      { title: 'Environment setup', estimatedMinutes: 60, priority: Priority.HIGH },
      { title: 'Install dependencies', estimatedMinutes: 45, priority: Priority.HIGH },
      { title: 'Configure build tools', estimatedMinutes: 30, priority: Priority.NORMAL },
      { title: 'Test setup', estimatedMinutes: 60, priority: Priority.NORMAL },
      { title: 'Documentation', estimatedMinutes: 30, priority: Priority.LOW }
    )
  } else {
    // Smart fallback based on task length and priority
    const wordCount = title.split(' ').length
    let subtaskCount = 3

    if (wordCount > 15) subtaskCount = 4
    if (wordCount > 25) subtaskCount = 5

    if (priority === Priority.URGENT) subtaskCount = 2
    else if (priority === Priority.LOW) subtaskCount = 2

    subtasks.push(
      { title: 'Define task scope and objectives', estimatedMinutes: 30, priority: Priority.HIGH },
      { title: 'Execute primary work', estimatedMinutes: 60, priority: Priority.HIGH },
      { title: 'Review and validate results', estimatedMinutes: 30, priority: Priority.NORMAL }
    )

    // Add additional subtasks based on type
    if (subtaskCount > 3) {
      subtasks.push(
        { title: 'Prepare documentation', estimatedMinutes: 20, priority: Priority.NORMAL }
      )
    }
    if (subtaskCount > 4) {
      subtasks.push(
        { title: 'Follow-up and communication', estimatedMinutes: 15, priority: Priority.LOW }
      )
    }
  }

  // Adjust subtask priorities based on overall task priority
  const adjustedSubtasks: DecomposedSubTask[] = subtasks.map(subtask => {
    let adjustedPriority = subtask.priority

    if (priority === Priority.URGENT && adjustedPriority === Priority.LOW) {
      adjustedPriority = Priority.NORMAL
    }
    if (priority === Priority.URGENT && adjustedPriority === Priority.NORMAL) {
      adjustedPriority = Priority.HIGH
    }
    if (priority === Priority.LOW && adjustedPriority === Priority.HIGH) {
      adjustedPriority = Priority.NORMAL
    }

    return { ...subtask, priority: adjustedPriority }
  })

  const totalMinutes = adjustedSubtasks.reduce((sum, subtask) => sum + subtask.estimatedMinutes, 0)

  // Determine suggested overall priority for the main task
  const suggestedPriority = calculateSuggestedPriority(priority, adjustedSubtasks)

  return {
    title: title.length > 50 ? title.substring(0, 50) + '...' : title,
    description,
    estimatedMinutes: totalMinutes,
    subtasks: adjustedSubtasks,
    suggestedPriority,
    confidence: calculateConfidence(adjustedSubtasks, keywords)
  }
}

function calculateSuggestedPriority(taskPriority: Priority, subtasks: DecomposedSubTask[]): Priority {
  // If any subtask is URGENT/HIGH and main task isn't urgent, bump up
  const highSubtasks = subtasks.filter(s => s.priority === Priority.URGENT || s.priority === Priority.HIGH).length

  if (highSubtasks >= 2) {
    return taskPriority === Priority.LOW ? Priority.HIGH : taskPriority
  }

  if (highSubtasks === 1 && taskPriority === Priority.NORMAL) {
    return Priority.HIGH
  }

  return taskPriority
}

function calculateConfidence(subtasks: DecomposedSubTask[], keywords: string): number {
  let confidence = 60

  // Increase confidence for well-defined tasks
  if (keywords.includes('plan') || keywords.includes('create') || keywords.includes('build')) {
    confidence += 20
  }

  // Decrease confidence for vague descriptions
  if (keywords.length < 20) {
    confidence -= 20
  }

  // More subtasks = higher confidence
  if (subtasks.length >= 5) confidence += 10

  // Priority alignment increases confidence
  const highPrioritySubtasks = subtasks.filter(s => s.priority === Priority.HIGH || s.priority === Priority.URGENT).length
  if (highPrioritySubtasks > 0) confidence += 10

  return Math.min(95, Math.max(30, confidence))
}