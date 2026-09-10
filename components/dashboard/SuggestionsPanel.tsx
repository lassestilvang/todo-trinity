"use client"

import { useState } from 'react'
import { useTaskContext } from '@/src/contexts'
import { useSuggestions } from '@/src/hooks/useSuggestions'
import { useToast } from '@/src/hooks/useToast'

export default function SuggestionsPanel({ onClose }: { onClose: () => void }) {
  const { parseNaturalLanguage, isParsing, error } = useSuggestions()
  const { addToast } = useToast()
  const { tasks } = useTaskContext()

  const [input, setInput] = useState('')
  const [showParser, setShowParser] = useState(false)
  const [proactiveSuggestions, setProactiveSuggestions] = useState<any[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [parsedResult, setParsedResult] = useState<any>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!input.trim()) return

    setShowParser(true)
    setParseError(null)

    try {
      const result = await parseNaturalLanguage(input)
      setParsedResult(result)
      addToast('Task parsed successfully!', 'success')

      // Create task from parsed data
      setInput('')
      setShowParser(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse task'
      setParseError(errorMessage)
      addToast(errorMessage, 'error')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] shadow-2xl overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Smart Suggestions
          </h2>
          <button
            onClick={onClose}
            className="absolute right-4 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Suggestions */}
          {proactiveSuggestions.length > 0 && (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {proactiveSuggestions.slice(0, 5).map((suggestion: any, index: number) => (
                <div
                  key={index}
                  className={`
                    bg-white rounded-lg p-4 border border-gray-200
                    cursor-pointer hover:bg-gray-50 transition-colors
                  `}
                  onClick={() => {
                    setInput(suggestion.title || '')
                    addToast(`Selected: ${suggestion.title}`, 'success')
                  }}
                >
                  <p className="font-medium text-gray-800 mb-1">{suggestion.title}</p>
                  <p className="text-xs text-gray-500">{suggestion.reason}</p>
                  {suggestion.suggestedPriority && (
                    <span
                      className={`text-sm font-medium ${priorityColorClass(suggestion.suggestedPriority)}`}
                    >
                      {suggestion.suggestedPriority}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {proactiveSuggestions.length === 0 && !isAnalyzing && (
            <p className="text-gray-500 text-sm text-center py-8">
              No suggestions available
            </p>
          )}

          {/* Natural Language Parser */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Add Task via Natural Language</h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. 'Buy groceries for tomorrow, high priority'"
                className="w-full px-3 py-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isParsing}
              />
              {parseError && (
                <p className="text-red-500 text-sm mt-2">{parseError}</p>
              )}
              <button
                onClick={handleSubmit}
                className={`mt-2 px-4 py-2 rounded ${isParsing ? 'opacity-50 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600 transition-colors'}`}
                disabled={!input.trim() || isParsing}
              >
                {isParsing ? 'Parsing...' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function priorityColorClass(priority: string): string {
  switch (priority) {
    case 'LOW': return 'text-green-600'
    case 'NORMAL': return 'text-blue-600'
    case 'HIGH': return 'text-yellow-600'
    case 'URGENT': return 'text-red-600'
    default: return 'text-gray-500'
  }
}