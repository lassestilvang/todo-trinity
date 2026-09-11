import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/templates - Get available templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Get all templates (system and user's custom)
    const templates = await prisma.template.findMany({
      where: {
        OR: [
          { userId: null }, // System templates
          { userId: session?.user?.id ?? undefined }, // User's custom templates
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        color: true,
        category: true,
        isCustom: true,
        tasks: {
          select: {
            title: true,
            description: true,
            priority: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          }
        },
      },
      orderBy: [
        { isCustom: false as const }, // System templates first
        { name: 'asc' },
      ]
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/templates - Create a custom template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to create templates' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    let body

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }

    const { name, description, category, icon, color, tasks } = body

    if (!name || !tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Name and tasks are required' },
        { status: 400 }
      )
    }

    const template = await prisma.template.create({
      data: {
        name,
        description,
        category: category || 'custom',
        icon: icon || 'clipboard-list',
        color: color || 'bg-gray-50 border-gray-200',
        isCustom: true,
        userId,
        tasks: {
          create: tasks.map((task: any) => ({
            title: task.title,
            description: task.description || '',
            priority: task.priority || 'NORMAL',
            order: tasks.indexOf(task),
          }))
        }
      },
      include: {
        tasks: true,
      }
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/templates/:id/apply - Apply a template
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to apply templates' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Template ID is required' },
        { status: 400 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }

    const { listId } = body

    // Get the template
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: { tasks: true }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Not found', message: 'Template not found' },
        { status: 404 }
      )
    }

    // Create tasks from template
    const createdTasks = []
    for (const taskTemplate of template.tasks) {
      const task = await prisma.task.create({
        data: {
          title: taskTemplate.title,
          description: taskTemplate.description,
          status: 'TODO',
          priority: taskTemplate.priority as any,
          userId,
          listId: listId || null,
        }
      })
      createdTasks.push(task)
    }

    return NextResponse.json({
      message: `Created ${createdTasks.length} tasks from template`,
      tasks: createdTasks
    })
  } catch (error) {
    console.error('Error applying template:', error)
    return NextResponse.json(
      { error: 'Failed to apply template', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/templates/:id - Delete a custom template
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to delete templates' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Template ID is required' },
        { status: 400 }
      )
    }

    const template = await prisma.template.findUnique({
      where: { id: templateId }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Not found', message: 'Template not found' },
        { status: 404 }
      )
    }

    if (template.userId !== userId && !template.isCustom === false) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You can only delete your own custom templates' },
        { status: 403 }
      )
    }

    await prisma.template.delete({
      where: { id: templateId }
    })

    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
