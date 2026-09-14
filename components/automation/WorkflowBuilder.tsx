"use client"

import { useState, useEffect } from 'react'
import { TaskStatus, Priority } from '@/src/types/index'
import { useTaskContext } from '@/src/contexts/TaskContext'
import { useToast } from '@/src/hooks/useToast'
import {
  GripVertical,
  Plus,
  Trash2,
  Settings,
  Play,
  Pause,
  Clock,
  Users,
  Filter,
  ListCheck,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react'

interface WorkflowStep {
  id: string
  type: 'trigger' | 'action' | 'condition'
  name: string
  description?: string
  config: any
  position: { x: number; y: number }
  inputs: any
  outputs: any
}

interface Workflow {
  id: string
  name: string
  description?: string
  trigger: WorkflowStep
  steps: WorkflowStep[]
  isActive: boolean
  createdAt: Date
  lastExecuted?: Date
  executionCount: number
}

interface TriggerConfig {
  type: 'schedule' | 'task_created' | 'task_completed' | 'priority_changed' | 'label_changed' | 'list_changed'
  schedule?: string
  taskType?: 'any' | 'urgent' | 'high' | 'normal' | 'low'
  labelIds?: string[]
  listId?: string
  assignedTo?: string
}

interface ActionConfig {
  type: 'create_task' | 'update_task' | 'assign_task' | 'add_label' | 'move_task' | 'send_notification' | 'webhook'
  taskData?: {
    title: string
    description?: string
    priority?: string
    dueDate?: string
    listId?: string
    labelIds?: string[]
    assignedTo?: string
  }
  notification?: {
    title: string
    message: string
    channel: 'in_app' | 'email' | 'slack'
  }
  webhook?: {
    url: string
    method: 'POST' | 'PUT' | 'PATCH'
    headers?: any
    body?: any
  }
}

type CanvasNode = {
  id: string
  type: string
  name: string
  icon?: React.ComponentType<{ className?: string }>
}

export default function WorkflowBuilder() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [canvasNodes, setCanvasNodes] = useState<CanvasNode[]>([])
  const { addToast } = useToast()

// Initialize canvas node types
  useEffect(() => {
    setCanvasNodes([
      { id: 'trigger-schedule', type: 'trigger', name: 'Schedule', icon: Clock },
      { id: 'trigger-task-created', type: 'trigger', name: 'Task Created', icon: CheckCircle },
      { id: 'trigger-task-completed', type: 'trigger', name: 'Task Completed', icon: ListCheck },
      { id: 'action-create-task', type: 'action', name: 'Create Task', icon: Plus },
      { id: 'action-update-task', type: 'action', name: 'Update Task', icon: Settings },
      { id: 'action-assign-task', type: 'action', name: 'Assign Task', icon: Users },
      { id: 'action-add-label', type: 'action', name: 'Add Label', icon: Filter },
      { id: 'action-move-task', type: 'action', name: 'Move Task', icon: ArrowRight },
      { id: 'condition-high-priority', type: 'condition', name: 'High Priority Check', icon: AlertCircle },
    ])
  }, [])

  const createWorkflow = () => {
    const newWorkflow: Workflow = {
      id: crypto.randomUUID(),
      name: 'New Workflow',
      trigger: {
        id: crypto.randomUUID(),
        type: 'trigger',
        name: 'Schedule',
        config: { type: 'schedule', schedule: '0 * * * *' },
        position: { x: 100, y: 50 },
        inputs: {},
        outputs: {}
      },
      steps: [],
      isActive: false,
      createdAt: new Date(),
      executionCount: 0,
    }
    setWorkflows([...workflows, newWorkflow])
    setSelectedWorkflow(newWorkflow)
    setIsCreating(false)
    addToast('Workflow created successfully', 'success')
  }

  const updateWorkflow = (id: string, updates: Partial<Workflow>) => {
    setWorkflows(workflows.map(w => (w.id === id ? { ...w, ...updates } : w)))
    if (selectedWorkflow?.id === id) {
      setSelectedWorkflow({ ...selectedWorkflow, ...updates })
    }
  }

  const deleteWorkflow = (id: string) => {
    setWorkflows(workflows.filter(w => w.id !== id))
    if (selectedWorkflow?.id === id) {
      setSelectedWorkflow(null)
    }
    addToast('Workflow deleted', 'success')
  }

  const addStep = (workflowId: string, type: 'trigger' | 'action' | 'condition') => {
    const node = canvasNodes.find(n => n.type === type)
    if (!node) return

    const step: WorkflowStep = {
      id: crypto.randomUUID(),
      type,
      name: node.name,
      config: getDefaultConfig(type),
      position: { x: Math.random() * 300 + 200, y: Math.random() * 200 + 100 },
      inputs: {},
      outputs: {}
    }

    const workflow = workflows.find(w => w.id === workflowId)
    if (workflow) {
      const updatedSteps = type === 'trigger' ? [step, ...workflow.steps] : [...workflow.steps, step]
      updateWorkflow(workflowId, { steps: updatedSteps })
    }
  }

  const updateStep = (workflowId: string, stepId: string, updates: Partial<WorkflowStep>) => {
    const workflow = workflows.find(w => w.id === workflowId)
    if (workflow) {
      const updatedSteps = workflow.steps.map(s =>
        s.id === stepId ? { ...s, ...updates } : s
      )
      updateWorkflow(workflowId, { steps: updatedSteps })
    }
  }

  const deleteStep = (workflowId: string, stepId: string) => {
    const workflow = workflows.find(w => w.id === workflowId)
    if (workflow) {
      const stepToDelete = workflow.steps.find(s => s.id === stepId)
      let updatedSteps = workflow.steps.filter(s => s.id !== stepId)

      if (stepToDelete?.type === 'trigger') {
        // Re-order trigger to be first
        const trigger = updatedSteps.find(s => s.type === 'trigger')
        if (trigger) {
          const nonTriggerSteps = updatedSteps.filter(s => s.type !== 'trigger')
          updatedSteps = [trigger, ...nonTriggerSteps]
        }
      }

      updateWorkflow(workflowId, { steps: updatedSteps })
    }
  }

  const executeWorkflow = async (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId)
    if (!workflow) return

    try {
      // Execute workflow logic (simplified)
      console.log('Executing workflow:', workflow.name)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate execution

      updateWorkflow(workflowId, {
        isActive: true,
        lastExecuted: new Date(),
        executionCount: workflow.executionCount + 1
      })

      addToast(`Workflow executed successfully`, 'success')
    } catch (error) {
      console.error('Workflow execution failed:', error)
      addToast('Workflow execution failed', 'error')
    }
  }

  const getDefaultConfig = (type: string): any => {
    switch (type) {
      case 'trigger':
        return { type: 'schedule', schedule: '0 * * * *' }
      case 'action':
        return { title: 'New Task', description: 'Auto-created' }
      case 'condition':
        return { priority: 'HIGH', operator: 'equals' }
      default:
        return {}
    }
  }

  const getNodeIcon = (type: string) => {
    const node = canvasNodes.find(n => n.id.startsWith(type))
    return node?.icon || Settings
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Workflow List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Workflows</h3>
          <button
            onClick={createWorkflow}
            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            New Workflow
          </button>
        </div>

        <div className="space-y-2">
          {workflows.map(workflow => (
            <div
              key={workflow.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedWorkflow?.id === workflow.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedWorkflow(workflow)}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{workflow.name}</h4>
                <div className="flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      executeWorkflow(workflow.id)
                    }}
                    className="p-1 text-green-600 hover:bg-green-100 rounded"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteWorkflow(workflow.id)
                    }}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span className={`px-2 py-0.5 rounded ${workflow.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {workflow.isActive ? 'Active' : 'Inactive'}
                </span>
                <span>{workflow.steps.length} steps</span>
                <span>Executed {workflow.executionCount} times</span>
              </div>

              {workflow.lastExecuted && (
                <div className="text-xs text-gray-400 mt-1">
                  Last: {workflow.lastExecuted.toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
          {workflows.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No workflows created yet</p>
              <p className="text-sm">Click "New Workflow" to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Workflow Builder Canvas */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        {selectedWorkflow ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Workflow Builder</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => addStep(selectedWorkflow.id, 'trigger')}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  + Trigger
                </button>
                <button
                  onClick={() => addStep(selectedWorkflow.id, 'action')}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  + Action
                </button>
                <button
                  onClick={() => addStep(selectedWorkflow.id, 'condition')}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  + Condition
                </button>
              </div>
            </div>

            <div className="relative bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 min-h-96">
              {/* Render workflow steps */}
              {selectedWorkflow.steps.map((step, index) => {
                const Icon = getNodeIcon(step.type)
                return (
                  <div
                    key={step.id}
                    className="absolute bg-white rounded-lg shadow-md border border-gray-200 p-3 cursor-move hover:shadow-lg transition-shadow"
                    style={{
                      left: step.position.x,
                      top: step.position.y,
                    }}
                    onMouseDown={(e) => {
                      // Implement drag functionality would go here
                    }}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <Icon className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-sm text-gray-900">{step.name}</span>
                      <button
                        onClick={() => deleteStep(selectedWorkflow.id, step.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      {step.type}
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      ID: {step.id.substring(0, 8)}...
                    </div>
                  </div>
                )
              })}

              {/* Connection lines would be rendered here */}
            </div>

            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setSelectedWorkflow(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
              <button
                onClick={() => executeWorkflow(selectedWorkflow.id)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Execute Workflow
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Zap className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">Select a Workflow</h3>
              <p className="text-sm">Choose a workflow from the list to edit it</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}