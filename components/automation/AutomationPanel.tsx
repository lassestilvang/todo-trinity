"use client"

import { useState } from 'react'
import { useTaskContext } from '@/src/contexts/TaskContext'
import { useToast } from '@/src/hooks/useToast'
import { automationEngine, AutomationRule } from '@/lib/automation'
import {
  Zap,
  Plus,
  Trash2,
  Play,
  Pause,
  Clock,
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

export default function AutomationPanel({ onClose }: { onClose?: () => void }) {
  const [rules, setRules] = useState<AutomationRule[]>(automationEngine.getRules())
  const [showSuggested, setShowSuggested] = useState(false)
  const { addToast } = useToast()

  const loadRules = () => {
    setRules(automationEngine.getRules())
  }

  const handleAddSuggested = (rule: AutomationRule) => {
    automationEngine.registerRule(rule)
    loadRules()
    addToast('Automation rule added', 'success')
  }

  const handleToggle = (id: string) => {
    const rule = automationEngine.getRule(id)
    if (rule) {
      automationEngine.updateRule(id, { isActive: !rule.isActive })
      loadRules()
      addToast(
        rule.isActive ? 'Automation paused' : 'Automation activated',
        'success'
      )
    }
  }

  const handleDelete = (id: string) => {
    automationEngine.deleteRule(id)
    loadRules()
    addToast('Automation rule deleted', 'success')
  }

  const handleExecute = async (id: string) => {
    const success = await automationEngine.executeRule(
      automationEngine.getRule(id)!
    )
    if (success) {
      loadRules()
      addToast('Automation executed successfully', 'success')
    } else {
      addToast('Automation execution failed', 'error')
    }
  }

  const suggestedRules = automationEngine.getSuggestedAutomations()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <Zap className="w-6 h-6 text-indigo-500" />
              <h2 className="text-2xl font-bold text-gray-900">Automation Rules</h2>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            )}
          </div>

          {/* Suggested Rules */}
          <div className="mb-6">
            <button
              onClick={() => setShowSuggested(!showSuggested)}
              className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 mb-3"
            >
              <Settings className="w-4 h-4" />
              <span className="font-medium">
                {showSuggested ? 'Hide' : 'Show'} Suggested Automations
              </span>
            </button>

            {showSuggested && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {suggestedRules.map(rule => (
                  <div
                    key={rule.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                  >
                    <h4 className="font-medium text-gray-900 mb-1">
                      {rule.name}
                    </h4>
                    <p className="text-sm text-gray-500 mb-3">
                      {rule.description}
                    </p>
                    <button
                      onClick={() => handleAddSuggested(rule)}
                      className="w-full px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm"
                    >
                      <Plus className="w-3 h-3 inline mr-1" />
                      Add Rule
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Rules */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Active Rules ({rules.length})
            </h3>

            {rules.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No automation rules yet</p>
                <p className="text-sm">Add a suggested rule above to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map(rule => (
                  <div
                    key={rule.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">
                            {rule.name}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              rule.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {rule.isActive ? 'Active' : 'Paused'}
                          </span>
                        </div>
                        {rule.description && (
                          <p className="text-sm text-gray-500 mb-2">
                            {rule.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Trigger: {rule.trigger.type}</span>
                          </span>
                          <span>Actions: {rule.actions.length}</span>
                          <span>Executed {rule.executionCount} times</span>
                          {rule.lastExecuted && (
                            <span>Last: {rule.lastExecuted.toLocaleString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-1 ml-4">
                        <button
                          onClick={() => handleExecute(rule.id)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded"
                          title="Execute now"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggle(rule.id)}
                          className={`p-2 rounded ${
                            rule.isActive
                              ? 'text-yellow-600 hover:bg-yellow-100'
                              : 'text-blue-600 hover:bg-blue-100'
                          }`}
                          title={rule.isActive ? 'Pause' : 'Activate'}
                        >
                          {rule.isActive ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}