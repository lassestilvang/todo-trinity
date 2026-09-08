"use client"

import { useState, useEffect } from 'react'
import { useToast } from '@/src/hooks/useToast'
import { motion } from 'framer-motion'

export default function SharePage() {
  const { addToast } = useToast()
  const [formData, setFormData] = useState({
    title: '',
    text: '',
    url: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [shareAvailable, setShareAvailable] = useState(false)

  useEffect(() => {
    // Check if Web Share API is available
    setShareAvailable('share' in navigator || 'canShare' in navigator)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleShare = async () => {
    if (!formData.title.trim() && !formData.text.trim()) {
      addToast('Please provide at least a title for the task', 'warning')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/integrations/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        addToast('Task created successfully from share!', 'success')
        setFormData({ title: '', text: '', url: '' })
      } else {
        addToast(result.message, 'error')
      }
    } catch (error) {
      console.error('Share error:', error)
      addToast('Failed to share content', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWebShare = async () => {
    if (!shareAvailable) return

    try {
      // Use Web Share API if available
      if ('share' in navigator) {
        await navigator.share({
          title: formData.title || 'Task from share',
          text: formData.text,
          url: window.location.href
        })

        // After successful share, create the task
        await handleShare()
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Web share failed:', error)
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6 md:p-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Share Content</h1>
        <p className="text-gray-600 mb-6">
          Share an article, link, or anything you want to remember as a task.
        </p>

        <form onSubmit={(e) => { e.preventDefault(); handleWebShare() }} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="What do you want to remember?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="text"
              name="text"
              value={formData.text}
              onChange={handleInputChange}
              placeholder="Add details, notes, or context..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
            />
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              URL
            </label>
            <input
              id="url"
              name="url"
              type="url"
              value={formData.url}
              onChange={handleInputChange}
              placeholder="https://example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleShare}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Task'}
            </button>

            {shareAvailable && (
              <button
                type="button"
                onClick={handleWebShare}
                disabled={isLoading}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C9.88 12.901 11.138 12.732 12.384 12.899m1.258 1.526c1.246.559 2.579.373 3.63-.335 1.034-1.003 1.003-2.713.345-3.74C17.42 8.322 16.16 8.08 15.029 8.263c-1.134.195-2.162.764-3.003 1.59m-6.792 0c-1.835-.039-3.68-.246-5.5-.63-1.2.442-2.333 1.148-3.425 2.031C2.33 15.45 2.33 17.79 2.33 20.5c0 2.91 2.33 5.5 5.5 5.5h4c3.17 0 5.5-2.59 5.5-5.5 0-2.71-2.33-5.05-5.5-5.5M16.684 13.342c-1.646.88-3.486 1.07-5.22 1.07" />
                </svg>
                Share
              </button>
            )}
          </div>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Commands (Voice Input)</h3>
          <p className="text-sm text-gray-600">
            Use the microphone button to create tasks by voice:r/
            "Create task: Remember to review the quarterly report"r/
            "Add task: Contact client about project timeline"
          </p>
        </div>
      </motion.div>
    </div>
  )
}