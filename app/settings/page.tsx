"use client"

import { useState, useEffect } from 'react'
import { useSettings } from '@/src/hooks/useTasks'
import { useToast } from '@/src/hooks/useToast'

export default function SettingsPage({ onClose }: { onClose: () => void }) {
  const { settings, loading, error, updateSettings } = useSettings()
  const { addToast } = useToast()
  const [localSettings, setLocalSettings] = useState<typeof settings>(settings)

  // Sync local settings when settings change
  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

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
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={onClose} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-500">
            Close
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateSettings(localSettings)
    addToast('Settings updated successfully', 'success')
    onClose()
  }

  const handleSettingChange = (key: keyof typeof localSettings, value: any) => {
    setLocalSettings((prev: typeof localSettings) => {
      const updated = { ...prev, [key]: value }
      return updated
    })
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
              value={localSettings.theme}
              onChange={(e) => handleSettingChange('theme', e.target.value)}
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
              value={localSettings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              className="mt-1 px-3 py-2 border rounded"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>

          {/* Integration Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Connected Integrations
            </label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {['google-calendar', 'outlook-calendar', 'github', 'slack', 'notion', 'zapier'].map((integration) => {
                const configMap: Record<string, { name: string; enabled: boolean }> = {
                  'google-calendar': { name: 'Google Calendar', enabled: localSettings.calendarSync?.google || false },
                  'outlook-calendar': { name: 'Outlook Calendar', enabled: localSettings.calendarSync?.microsoft || false },
                  'github': { name: 'GitHub', enabled: localSettings.integrations?.github || false },
                  'slack': { name: 'Slack', enabled: localSettings.integrations?.slack || false },
                  'notion': { name: 'Notion', enabled: false },
                  'zapier': { name: 'Zapier', enabled: localSettings.integrations?.zapier || false },
                }

                const config = configMap[integration] || { name: integration, enabled: false }

                return (
                  <label key={integration} className="flex items-center space-x-2 px-3 py-2 rounded bg-gray-100">
                    <div
                      className={`w-6 h-6 rounded ${config.enabled ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center text-sm font-bold text-white`}
                    >
                      {integration.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-600">{config.name}</span>
                  </label>
                )
              })}
            </div>
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
                  checked={localSettings.notifications}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                  className="rounded"
                />
                <span className="text-gray-600">Desktop</span>
              </label>
              <label className="flex items-center space-x-2 px-3 py-2 rounded bg-gray-100">
                <input
                  type="checkbox"
                  checked={localSettings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                  className="rounded"
                />
                <span className="text-gray-600">Email</span>
              </label>
              <label className="flex items-center space-x-2 px-3 py-2 rounded bg-gray-100">
                <input
                  type="checkbox"
                  checked={localSettings.desktopNotifications}
                  onChange={(e) => handleSettingChange('desktopNotifications', e.target.checked)}
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
                <label key={goal} className={`flex flex-col items-center rounded bg-gray-100 p-2 cursor-pointer ${localSettings.dailyGoal === goal ? 'bg-blue-500 text-white' : ''}`}>
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
              value={localSettings.reminderTime}
              onChange={(e) => handleSettingChange('reminderTime', e.target.value)}
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
              value={localSettings.keyboardShortcuts}
              onChange={(e) => handleSettingChange('keyboardShortcuts', e.target.value)}
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
              value={localSettings.animationsEnabled}
              onChange={(e) => handleSettingChange('animationsEnabled', e.target.value)}
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