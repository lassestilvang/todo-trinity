import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

// POST /api/integrations/share - Share target handler
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const title = formData.get('title')?.toString() || ''
    const text = formData.get('text')?.toString() || ''
    const url = formData.get('url')?.toString() || ''

    // Create task from shared content
    if (title || text) {
      const taskData = {
        title: title || 'Shared from web',
        description: text,
      }

      // Try to fetch or create a list if needed
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      })

      if (response.ok) {
        const result = await response.json()
        return NextResponse.json({
          success: true,
          message: 'Task created from shared content',
          task: result.task,
        })
      }
    }

    return NextResponse.json({
      success: false,
      message: 'Could not create task from shared content',
    }, { status: 400 })
  } catch (error) {
    console.error('Share target error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to process shared content',
    }, { status: 500 })
  }
}

// GET /api/integrations/share - Show share target form (for testing)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    title: 'Share to Todo Trinity',
    description: 'Share a task, article, or link to your task manager',
    fields: [
      { name: 'title', label: 'Task Title', placeholder: 'What are you sharing?' },
      { name: 'text', label: 'Description', placeholder: 'Add details about the shared content' },
      { name: 'url', label: 'URL', placeholder: 'Optional link to include' }
    ],
    submitText: 'Create Task',
  })
}