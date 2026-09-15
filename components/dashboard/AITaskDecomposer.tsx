"use client"

import { useState } from 'react'
import { TaskStatus, Priority } from '@/src/types/index'
import { useTaskContext } from '@/src/contexts'
import { useToast } from '@/src/hooks/useToast'
import { Sparkles, Loader2, Check, X, Brain, Clock, ListOrdered, Trash2 } from 'lucide-react'

interface SubTask {
  title: string
  description?: string
  estimatedMinutes: number
  priority: Priority
}

interface DecompositionResult {
  taskId?: string
  title: string
  description?: string
  estimatedMinutes: number
  subtasks: SubTask[]
}

export default function AITaskDecomposer({ onClose }: { onClose: () => void }) {
  const { createTask } = useTaskContext()
  const { addToast } = useToast()

  const [inputText, setInputText] = useState('')
  const [decomposedTask, setDecomposedTask] = useState<DecompositionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDecompose = async () => {
    if (!inputText.trim()) return

    setLoading(true)
    setError(null)

    try {
      // In production, this would call an AI service
      // For now, we'll simulate AI decomposition
      const result = await simulateAIDecomposition(inputText)
      setDecomposedTask(result)
    } catch (err: any) {
      setError(err.message || 'Failed to decompose task')
      addToast('Failed to decompose task', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTasks = async () => {
    if (!decomposedTask) return

    try {
      // Create the main task
      const mainTask = await createTask({
        title: decomposedTask.title,
        description: decomposedTask.description,
        status: TaskStatus.TODO,
        priority: Priority.NORMAL,
        labels: [],
      })

      // Create subtasks
      for (const subtask of decomposedTask.subtasks) {
        await createTask({
          title: subtask.title,
          description: subtask.description,
          status: TaskStatus.TODO,
          priority: subtask.priority,
          labels: [],
        })
      }

      addToast(`Created main task with ${decomposedTask.subtasks.length} subtasks`, 'success')
      setDecomposedTask(null)
      setInputText('')
      onClose()
    } catch (err: any) {
      addToast(err.message || 'Failed to create tasks', 'error')
    }
  }

  const handleRemoveSubtask = (index: number) => {
    if (decomposedTask) {
      setDecomposedTask({
        ...decomposedTask,
        subtasks: decomposedTask.subtasks.filter((_, i) => i !== index)
      })
    }
  }

  const handleUpdateSubtask = (index: number, field: keyof SubTask, value: any) => {
    if (decomposedTask) {
      const updated = [...decomposedTask.subtasks]
      updated[index] = { ...updated[index], [field]: value }
      setDecomposedTask({ ...decomposedTask, subtasks: updated })
    }
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const totalEstimatedMinutes = decomposedTask?.subtasks.reduce((sum, s) => sum + s.estimatedMinutes, 0) || 0

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end p-4">
      <div className="bg-white rounded-t-2xl w-full max-w-2xl max-h-[80vh] shadow-2xl flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">AI Task Decomposer</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {decomposedTask ? (
            // Show decomposed task
            <div className="space-y-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-purple-900">{decomposedTask.title}</h3>
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                    Total: {formatTime(totalEstimatedMinutes)}
                  </span>
                </div>
                {decomposedTask.description && (
                  <p className="text-sm text-purple-700">{decomposedTask.description}</p>
                )}
              </div>

              <h4 className="text-sm font-medium text-gray-700 mb-2">Subtasks ({decomposedTask.subtasks.length})</h4>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {decomposedTask.subtasks.map((subtask, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 flex items-center space-x-2">
                    <input
                      type="text"
                      value={subtask.title}
                      onChange={(e) => handleUpdateSubtask(index, 'title', e.target.value)}
                      className="flex-1 px-2 py-1 border rounded text-sm"
                    />
                    <input
                      type="number"
                      value={subtask.estimatedMinutes}
                      onChange={(e) => handleUpdateSubtask(index, 'estimatedMinutes', parseInt(e.target.value) || 0)}
                      min="1"
                      max="480"
                      className="w-16 px-2 py-1 border rounded text-sm"
                    />
                    <span className="text-xs text-gray-500">min</span>
                    <select
                      value={subtask.priority}
                      onChange={(e) => handleUpdateSubtask(index, 'priority', e.target.value as any)}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                    <button
                      onClick={() => handleRemoveSubtask(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Total estimated time: <span className="font-medium">{formatTime(totalEstimatedMinutes)}</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCreateTasks}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Create Tasks</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Input form
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3">
                  Describe your task or project in natural language, and AI will break it down into manageable subtasks with time estimates.
                </p>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Task Description</label>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="e.g., 'Plan a team offsite for next month with agenda, venue booking, catering, and activities'"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500">
                    Examples: &quot;Write a blog post about React hooks&quot;, &quot;Prepare Q3 budget presentation&quot;, &quot;Set up new employee onboarding&quot;
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
                  {error}
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={handleDecompose}
                  disabled={loading || !inputText.trim()}
                  className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Decompose with AI</span>
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            AI-powered task decomposition using natural language processing
          </p>
        </div>
      </div>
    </div>
  )
}

async function simulateAIDecomposition(input: string): Promise<DecompositionResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500))

  // Simple keyword-based decomposition (in production, use actual AI)
  const keywords = input.toLowerCase()
  let title = input
  let description = ''
  let subtasks: SubTask[] = []

  // Extract title from input
  if (input.length > 50) {
    title = input.substring(0, 50) + '...'
    description = input
  }

  // Generate subtasks based on keywords
  if (keywords.includes('plan') || keywords.includes('organize')) {
    subtasks = [
      { title: 'Define objectives and scope', estimatedMinutes: 30, priority: Priority.HIGH },
      { title: 'Create timeline and milestones', estimatedMinutes: 45, priority: Priority.HIGH },
      { title: 'Identify resources and budget', estimatedMinutes: 30, priority: Priority.NORMAL },
      { title: 'Assign responsibilities', estimatedMinutes: 20, priority: Priority.NORMAL },
      { title: 'Set up tracking and communication', estimatedMinutes: 15, priority: Priority.LOW },
    ]
  } else if (keywords.includes('write') || keywords.includes('draft') || keywords.includes('blog') || keywords.includes('article')) {
    subtasks = [
      { title: 'Research and outline', estimatedMinutes: 45, priority: Priority.HIGH },
      { title: 'Write first draft', estimatedMinutes: 90, priority: Priority.HIGH },
      { title: 'Review and edit', estimatedMinutes: 30, priority: Priority.NORMAL },
      { title: 'Add formatting and images', estimatedMinutes: 20, priority: Priority.LOW },
      { title: 'Final proofread and publish', estimatedMinutes: 15, priority: Priority.NORMAL },
    ]
  } else if (keywords.includes('meeting') || keywords.includes('presentation') || keywords.includes('report')) {
    subtasks = [
      { title: 'Gather data and materials', estimatedMinutes: 60, priority: Priority.HIGH },
      { title: 'Create outline/agenda', estimatedMinutes: 30, priority: Priority.HIGH },
      { title: 'Build slides/document', estimatedMinutes: 90, priority: Priority.HIGH },
      { title: 'Review with stakeholders', estimatedMinutes: 45, priority: Priority.NORMAL },
      { title: 'Finalize and distribute', estimatedMinutes: 15, priority: Priority.NORMAL },
    ]
  } else if (keywords.includes('code') || keywords.includes('develop') || keywords.includes('build') || keywords.includes('implement')) {
    subtasks = [
      { title: 'Requirements analysis', estimatedMinutes: 45, priority: Priority.HIGH },
      { title: 'Design architecture', estimatedMinutes: 60, priority: Priority.HIGH },
      { title: 'Implement core functionality', estimatedMinutes: 180, priority: Priority.HIGH },
      { title: 'Write tests', estimatedMinutes: 60, priority: Priority.NORMAL },
      { title: 'Code review and refactor', estimatedMinutes: 45, priority: Priority.NORMAL },
      { title: 'Deploy and verify', estimatedMinutes: 30, priority: Priority.NORMAL },
    ]
  } else {
    // Generic decomposition
    subtasks = [
      { title: 'Break down requirements', estimatedMinutes: 30, priority: Priority.HIGH },
      { title: 'Create action plan', estimatedMinutes: 45, priority: Priority.HIGH },
      { title: 'Execute main work', estimatedMinutes: 90, priority: Priority.HIGH },
      { title: 'Review and validate', estimatedMinutes: 30, priority: Priority.NORMAL },
      { title: 'Finalize and document', estimatedMinutes: 20, priority: Priority.LOW },
    ]
  }

  const totalMinutes = subtasks.reduce((sum, s) => sum + s.estimatedMinutes, 0)

  return {
    title,
    description,
    estimatedMinutes: totalMinutes,
    subtasks
  }
}