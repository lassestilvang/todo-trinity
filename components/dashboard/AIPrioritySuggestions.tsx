"use client"

import { useState, useEffect } from 'react'
import { useUser } from '@/src/contexts'
import { PriorityInsight } from '@/lib/ai/types'
import { AlertTriangle, TrendingUp, Clock, Target, X } from 'lucide-react'

interface PrioritySuggestionsResponse {
  success: boolean
  recommendations: any[]
  insights: PriorityInsight[]
  workload: {
    totalTasks: number
    activeTasks: number
    overdueTasks: number
  }
  productivityPatterns: {
    peakHours: number[]
    bestDays: number[]
  }
}

export default function AIPrioritySuggestions() {
  const { user } = useUser()
  const [suggestions, setSuggestions] = useState<PriorityInsight[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchPrioritySuggestions()
    }
  }, [user?.id])

  const fetchPrioritySuggestions = async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/priority')
      if (!response.ok) throw new Error('Failed to fetch priority suggestions')

      const data: PrioritySuggestionsResponse = await response.json()
      setSuggestions(data.insights)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-300'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'NORMAL': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'LOW': return 'bg-green-100 text-green-800 border-green-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT': return AlertTriangle
      case 'HIGH': return TrendingUp
      case 'NORMAL': return Target
      case 'LOW': return Clock
      default: return Target
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-blue-600'
    if (confidence >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Analyzing priorities with AI...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-red-600 text-center py-4">
          <p>Error: {error}</p>
          <button
            onClick={fetchPrioritySuggestions}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
          AI Priority Suggestions
        </h3>
        <p className="text-gray-600">No priority suggestions available at this time.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
          AI Priority Suggestions ({suggestions.length} tasks)
        </h3>
        <button
          onClick={fetchPrioritySuggestions}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Workload Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {suggestions.length}/{suggestions.filter(s => s.currentPriority !== s.suggestedPriority).length}
          </div>
          <div className="text-xs text-gray-600">Tasks With Updates</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {suggestions.filter(s => s.confidence >= 80).length}
          </div>
          <div className="text-xs text-gray-600">High Confidence</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length || 0}
          </div>
          <div className="text-xs text-gray-600">Avg Confidence</div>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        {suggestions.map((insight) => {
          const PriorityIcon = getPriorityIcon(insight.suggestedPriority)
          const isExpanded = expandedTask === insight.taskId

          return (
            <div
              key={insight.taskId}
              className={`border rounded-lg p-4 transition-all ${isExpanded ? 'col-span-2' : ''}`}
            >
              <div
                className="flex items-start justify-between cursor-pointer"
                onClick={() => setExpandedTask(isExpanded ? null : insight.taskId)}
              >
                <div className="flex items-start space-x-3 flex-1">
                  <PriorityIcon className="w-5 h-5 mt-1" />

                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>

                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(insight.currentPriority)}`}>{
                        insight.currentPriority
                      }</span>
                      <span className="text-gray-400">→</span>
                      <span className={`px-2 py-1 text-xs rounded border font-medium ${getPriorityColor(insight.suggestedPriority)}`}>{
                        insight.suggestedPriority
                      }</span>
                      <span className={`text-sm ml-2 ${getConfidenceColor(insight.confidence)}`}>
                        {insight.confidence}% confidence
                      </span>
                    </div>

                    {!isExpanded && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {insight.reasoning}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedTask(isExpanded ? null : insight.taskId)
                  }}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  {isExpanded ? '−' : '+'}
                </button>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Reasoning:</h5>
                    <p className="text-sm text-gray-600">{insight.reasoning}</p>
                  </div>

                  {insight.alternatives.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Alternative Priorities:</h5>
                      <div className="flex space-x-2">
                        {insight.alternatives.map(alt => (
                          <span
                            key={alt}
                            className={`px-2 py-1 text-xs rounded border ${getPriorityColor(alt)}`}
                          >
                            {alt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Task ID: {insight.taskId}</span>
                    <span>Confidence: {insight.confidence}%</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}