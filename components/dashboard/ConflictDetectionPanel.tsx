"use client"

import { useState, useEffect, useCallback } from 'react'
import { Conflict, ConflictResolution } from '@/lib/ai/conflict-detection'
import { useUser } from '@/src/contexts'
import { AlertTriangle, AlertCircle, Zap, Shield, Layout, Palette, Plus } from 'lucide-react'

interface ConflictAnalysisResponse {
  success: boolean
  conflicts: Conflict[]
  summary: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
  }
  generatedAt: Date
  timeBlocks: any[]
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 border-red-500 text-red-800'
    case 'high': return 'bg-orange-100 border-orange-500 text-orange-800'
    case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-800'
    case 'low': return 'bg-blue-100 border-blue-500 text-blue-800'
    default: return 'bg-gray-100 border-gray-500 text-gray-800'
  }
}

const getSeverityLabel = (severity: string) => {
  switch (severity) {
    case 'critical': return 'Critical'
    case 'high': return 'High'
    case 'medium': return 'Medium'
    case 'low': return 'Low'
    default: return 'Low'
  }
}

const getConflictTypeIcon = (type: string) => {
  switch (type) {
    case 'time_overlap': return AlertCircle
    case 'deadline_conflict': return Zap
    case 'dependency_conflict': return Shield
    case 'workload_conflict': return Layout
    case 'resource_conflict': return Palette
    default: return AlertTriangle
  }
}

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'time_overlap': return 'Time Overlap'
    case 'deadline_conflict': return 'Deadline Conflict'
    case 'dependency_conflict': return 'Dependency Conflict'
    case 'workload_conflict': return 'Workload Conflict'
    case 'resource_conflict': return 'Resource Conflict'
    default: return 'Conflict'
  }
}

const getTypeIcon = (type: string) => {
  const icons: Record<string, React.ElementType> = {
    time_overlap: AlertCircle,
    deadline_conflict: Zap,
    dependency_conflict: Shield,
    workload_conflict: Layout,
    resource_conflict: Palette
  }
  return icons[type] || AlertTriangle
}

export default function ConflictDetectionPanel() {
  const { user } = useUser()
  const [analysis, setAnalysis] = useState<ConflictAnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedConflict, setExpandedConflict] = useState<string | null>(null)

  const fetchConflictAnalysis = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/conflicts')
      if (!response.ok) throw new Error('Failed to detect conflicts')
      const data: ConflictAnalysisResponse = await response.json()
      setAnalysis(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      fetchConflictAnalysis()
    }
  }, [user?.id, fetchConflictAnalysis])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg">Analyzing schedule...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-6 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p>{error}</p>
          <button onClick={fetchConflictAnalysis} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Retry</button>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 text-center">
          <h3 className="text-lg font-medium flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-gray-500" />
            Schedule Analysis
          </h3>
          <p className="mt-4 text-gray-600">No conflicts detected or run analysis above</p>
        </div>
      </div>
    )
  }

  const severityCounts = analysis.summary

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            <Zap className="w-5 h-5 mr-2 text-yellow-500" />
            Schedule Conflict Detection
          </h2>
          <button
            onClick={() => setExpandedConflict(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className={`p-3 rounded border ${getSeverityColor('critical')}`}>
              <div className="text-2xl font-bold text-red-600">{severityCounts.critical}</div>
              <div className="text-xs text-red-600">Critical</div>
            </div>
            <div className={`p-3 rounded border ${getSeverityColor('high')}`}>
              <div className="text-2xl font-bold text-orange-600">{severityCounts.high}</div>
              <div className="text-xs text-orange-600">High</div>
            </div>
            <div className={`p-3 rounded border ${getSeverityColor('medium')}`}>
              <div className="text-2xl font-bold text-yellow-600">{severityCounts.medium}</div>
              <div className="text-xs text-yellow-600">Medium</div>
            </div>
            <div className={`p-3 rounded border ${getSeverityColor('low')}`}>
              <div className="text-2xl font-bold text-blue-600">{severityCounts.low}</div>
              <div className="text-xs text-blue-600">Low</div>
            </div>
          </div>

          {/* Conflicts List */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">
              {analysis.conflicts.length} Conflicts Detected
            </h3>

            {analysis.conflicts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No conflicts detected in your schedule</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analysis.conflicts.map((conflict) => {
                  const isExpanded = expandedConflict === conflict.id
                  const IconComponent = getTypeIcon(conflict.type)

                  return (
                    <div
                      key={conflict.id}
                      className={`border rounded-lg p-4 transition-all ${isExpanded ? 'col-span-4' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <IconComponent className="w-5 h-5 mt-1 text-gray-400" />
                          <div>
                            <h4 className="font-medium text-gray-900">{conflict.title}</h4>
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {conflict.description}
                            </p>
                          </div>
                        </div>

                        <div className={`px-2 py-1 rounded text-xs border ${getSeverityColor(conflict.severity)}`}>
                          {getSeverityLabel(conflict.severity)}
                        </div>
                      </div>

                      <button
                        onClick={() => setExpandedConflict(conflict.id)}
                        className="text-gray-400 hover:text-gray-600 mt-2 text-sm flex items-center"
                      >
                        {isExpanded ? '−' : '+'}
                        <Plus className="w-3 h-3 ml-1" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Expanded View */}
          {expandedConflict && analysis.conflicts.length > 0 && (
            <div className="mt-6 pt-6 border-t space-y-6">
              <h3 className="text-lg font-medium text-gray-700 mb-4">
                {getSeverityLabel(
                  analysis.conflicts.find(c => c.id === expandedConflict)?.severity || 'medium'
                )}{' '}
                Conflict Details
              </h3>

              {(() => {
                const conflict = analysis.conflicts.find(c => c.id === expandedConflict)
                if (!conflict) return null

                return (
                  <div className="space-y-6">
                    {/* Resolution Actions */}
                    {conflict.resolutions && conflict.resolutions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Suggested Resolutions:</h4>
                        <div className="space-y-3">
                          {conflict.resolutions.map((resolution) => (
                            <div key={resolution.id} className={`p-3 rounded border ${getSeverityColor(resolution.estimatedImpact)}`}>
                              <h5 className="font-medium text-gray-900 mb-1">{resolution.title}</h5>
                              <p className="text-sm text-gray-600">{resolution.description}</p>
                              {resolution.newStartTime && (
                                <p className="text-xs text-gray-500 mt-2">
                                  {resolution.type === 'reschedule'
                                    ? `New start time: ${new Date(resolution.newStartTime).toLocaleTimeString()}`
                                    : ''}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Affected tasks summary */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Affected Tasks ({conflict.affectedTasks.length}):</h4>
                      <div className="flex flex-wrap gap-2">
                        {conflict.affectedTasks.map((taskId: string) => (
                          <span
                            key={taskId}
                            className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800"
                          >
                            T#{taskId.substring(0, 6)}...
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}