"use client"

import { useState } from 'react'
import { useSettings } from '@/src/hooks/useTasks'
import { useToast } from '@/src/hooks/useToast'

export default function SettingsPage({ onClose }: { onClose: () => void }) {
  const { settings, loading, error, updateSettings } = useSettings()
  const { addToast } = useToast()

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-6 max-w-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button onClick={onClose} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Close
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateSettings(settings)
    addToast('Settings updated successfully', 'success')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">User Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Theme
            </label>
            <select
              value={settings.theme}
              onChange={(e) => settings.theme = e.target.value}
              className="mt-1 px-3 py-2 border rounded"
            >
              <option value="system">System Default</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => settings.language = e.target.value}
              className="mt-1 px-3 py-2 border rounded"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>

          {/* Notifications */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notifications
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="flex items-center space-x-2 px-3 py-2 rounded bg-gray-100">
                <input
                  type="checkbox"
                  checked={settings.notifications === 'true'}
                  onChange={(e) => settings.notifications = e.target.checked ? 'true' : 'false'}
                  className="rounded"
                />
                <span className="text-gray-600">Desktop</span>
              </label>
              <label className="flex items-center space-x-2 px-3 py-2 rounded bg-gray-100">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications === 'true'}
                  onChange={(e) => settings.emailNotifications = e.target.checked ? 'true' : 'false'}
                  className="rounded"
                />
                <span className="text-gray-600">Email</span>
              </label>
              <label className="flex items-center space-x-2 px-3 py-2 rounded bg-gray-100">
                <input
                  type="checkbox"
                  checked={settings.desktopNotifications === 'true'}
                  onChange={(e) => settings.desktopNotifications = e.target.checked ? 'true' : 'false'}
                  className="rounded"
                />
                <span className="text-gray-600">Push</span>
              </label>
            </div>
          </div>

          {/* Daily Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Daily Task Goal
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 3, 5, 7, 10].map((goal) => (
                <label key={goal} className="flex flex-col items-center rounded bg-gray-100 p-2 cursor-pointer ${
                  settings.dailyGoal === goal.toString()
                    ? 'bg-blue-500 text-white'
                    : ''
                }">
                  <span className="font-bold text-lg">{goal}</span>
                  <span className="text-xs text-gray-500">tasks/day</span>
                </label>
              ))}
            </div>
          </div>

          {/* Reminders */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reminder Time
            </label>
            <input
              type="time"
              value={settings.reminderTime}
              onChange={(e) => settings.reminderTime = e.target.value}
              className="mt-1 block w-full px-3 py-2 border rounded"
            />
            <p className="text-xs text-gray-500 mt-1">
              Remind me to start my daily tasks
            </p>
          </div>

          {/* Keyboard Shortcuts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keyboard Shortcuts
            </label>
            <select
              value={settings.keyboardShortcuts}
              onChange={(e) => settings.keyboardShortcuts = e.target.value}
              className="mt-1 px-3 py-2 border rounded"
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>

          {/* Appearance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Animations
            </label>
            <select
              value={settings.animationsEnabled}
              onChange={(e) => settings.animationsEnabled = e.target.value}
              className="mt-1 px-3 py-2 border rounded"
            >
              <option value="true">Enabled</option>
              <option value="false">Reduced Motion</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  )
}