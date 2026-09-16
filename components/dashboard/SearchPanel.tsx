"use client"

import { useState } from 'react'
import { useSavedSearches } from '@/src/hooks/useTasks'
import { useToast } from '@/src/hooks/useToast'
import { Search, Plus, Trash2, Save, Loader2 } from 'lucide-react'

export default function SearchPanel({ onClose }: { onClose: () => void }) {
  const { searches, loading: loadingSearches, saveSearch, deleteSearch } = useSavedSearches()
  const { addToast } = useToast()
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [currentQuery, setCurrentQuery] = useState('')
  const [currentFilters, setCurrentFilters] = useState({})

  const handleSaveSearch = () => {
    if (!saveName.trim()) {
      addToast('Please enter a name for your search', 'error')
      return
    }

    saveSearch({ name: saveName, query: currentQuery, filters: currentFilters })
    setShowSaveModal(false)
    setSaveName('')
  }

  const handleApplySearch = (search: any) => {
    // This would trigger a search with the saved filters/query
    // In a real implementation, this would update the dashboard filters
    addToast(`Applied search: ${search.name}`, 'success')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] shadow-2xl overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Saved Searches</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Save Current Search */}
          <div>
            <h3 className="text-lg font-medium mb-3">Save Current Search</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder='Search name (e.g., "Urgent tasks due this week")'
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={showSaveModal}
              />
              <button
                onClick={() => setShowSaveModal(!showSaveModal)}
                className={`w-full px-4 py-2 rounded ${showSaveModal ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-gray-300 transition-colors`}
              >
                {showSaveModal ? 'Cancel' : 'Save Search'}
              </button>

              {showSaveModal && (
                <div className="mt-2">
                  <button
                    onClick={handleSaveSearch}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Saved Searches List */}
          <div>
            <h3 className="text-lg font-medium mb-3">Your Saved Searches</h3>
            {loadingSearches ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : searches.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No saved searches yet. Save your current search filters to reuse them later.
              </p>
            ) : (
              <div className="space-y-3">
                {searches.map((search: any, index: number) => (
                  <div
                    key={search.name || index}
                    className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{search.name}</h4>
                        {search.query && (
                          <p className="text-xs text-gray-500 mb-1">Query: &ldquo;{search.query}&rdquo;</p>
                        )}
                        {Object.keys(search.filters || {}).length > 0 && (
                          <p className="text-xs text-gray-500">
                            Filters: {Object.keys(search.filters).join(', ')}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          Saved {new Date(search.savedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleApplySearch(search)}
                          className="p-1 text-blue-600 hover:text-blue-700"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteSearch(search.name)}
                          className="p-1 text-gray-400 hover:text-red-600"
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