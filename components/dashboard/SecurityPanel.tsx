"use client"

import { useState, useEffect } from 'react'
import { useToast } from '@/src/hooks/useToast'
import {
  Shield,
  AlertTriangle,
  Lock,
  CheckCircle,
  Users,
  Database,
  Key,
  Settings,
  RefreshCw,
} from 'lucide-react'

type SecuritySettingValue = boolean | number

interface SecuritySetting {
  key: string
  label: string
  type: 'toggle' | 'number'
  value: SecuritySettingValue
  description?: string
  min?: number
  max?: number
}

export default function SecurityPanel({ onClose }: { onClose?: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const { addToast } = useToast()

  // Mock security data - in production this would come from API
  const [securityStats, setSecurityStats] = useState({
    activeSessions: 12,
    failedLoginAttempts: 3,
    rateLimitHits: 0,
    suspiciousActivity: 0,
    lastSecurityScan: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    twoFactorEnabled: 0,
    passwordPolicyEnabled: 1,
  })

  const [securitySettings, setSecuritySettings] = useState<SecuritySetting[]>([
    {
      key: 'twoFactorEnabled',
      label: 'Two-Factor Authentication',
      type: 'toggle',
      value: false,
      description: 'Require two-factor authentication for all users',
    },
    {
      key: 'passwordPolicyEnabled',
      label: 'Enforce Strong Passwords',
      type: 'toggle',
      value: true,
      description: 'Require complex passwords with minimum length',
    },
    {
      key: 'sessionTimeout',
      label: 'Session Timeout (minutes)',
      type: 'number',
      value: 60,
      min: 5,
      max: 480,
      description: 'Automatic logout after inactivity',
    },
    {
      key: 'maxLoginAttempts',
      label: 'Max Login Attempts',
      type: 'number',
      value: 5,
      min: 3,
      max: 10,
      description: 'Lock account after failed attempts',
    },
    {
      key: 'lockoutDuration',
      label: 'Lockout Duration (minutes)',
      type: 'number',
      value: 30,
      min: 5,
      max: 1440,
      description: 'Duration of account lockout',
    },
  ])

  const handleToggleSetting = async (key: string, value: boolean) => {
    setIsSaving(true)
    try {
      // In real app: await fetch(`/api/admin/security`, { method: 'PUT', ... })
      // For now: simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      setSecuritySettings(prev =>
        prev.map((setting) =>
          setting.key === key ? { ...setting, value } : setting
        )
      )

      addToast('Security setting updated', 'success')
    } catch (error) {
      addToast('Failed to update setting', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleNumberChange = (key: string, value: number) => {
    setSecuritySettings(prev =>
      prev.map((setting) =>
        setting.key === key ? { ...setting, value } : setting
      )
    )
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      // In real app: await fetch(`/api/admin/security`, { method: 'PUT', body: JSON.stringify(settings) })
      await new Promise(resolve => setTimeout(resolve, 1500))

      addToast('All security settings saved', 'success')
      setIsEditing(false)
    } catch (error) {
      addToast('Failed to save settings', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRunSecurityScan = async () => {
    setIsLoading(true)
    try {
      // Simulate security scan
      await new Promise(resolve => setTimeout(resolve, 3000))

      setSecurityStats(prev => ({
        ...prev,
        lastSecurityScan: new Date(),
        suspiciousActivity: Math.floor(Math.random() * 5),
      }))

      addToast('Security scan completed', 'success')
    } catch (error) {
      addToast('Security scan failed', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-900">Security & Compliance</h2>
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

          {/* Security Overview */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-600">Active Sessions</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{securityStats.activeSessions}</p>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-600">Failed Logins</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">{securityStats.failedLoginAttempts}</p>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-600">Last Scan</span>
                  </div>
                  <p className="text-sm font-medium text-green-600">
                    {new Date(securityStats.lastSecurityScan).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <button
                  onClick={handleRunSecurityScan}
                  disabled={isLoading}
                  className="w-full flex items-center justify-between px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <span className="flex-1 text-left">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Run Security Scan
                  </span>
                  {isLoading && (
                    <span className="animate-spin w-4 h-4 inline-block text-purple-500" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Security Settings
            </h3>

            <div className="space-y-4">
              {securitySettings.map(setting => (
                <div
                  key={setting.key}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{setting.label}</h4>
                      {setting.description && (
                        <p className="text-sm text-gray-500">{setting.description}</p>
                      )}
                    </div>
                    {setting.type === 'toggle' && (
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          setting.value
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                        >
                          {setting.value ? 'Enabled' : 'Disabled'}
                        </span>
                        <button
                          onClick={() => handleToggleSetting(setting.key, !setting.value)}
                          disabled={isSaving}
                          className={`p-2 rounded ${
                            isSaving
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : setting.value
                                ? 'text-red-600 hover:bg-red-100'
                                : 'text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {setting.value ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                    {setting.type === 'number' && (
                      <input
                        type="number"
                        value={setting.value}
                        min={setting.min}
                        max={setting.max}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || setting.min
                          handleNumberChange(setting.key, Math.min(Math.max(val, setting.min), setting.max))
                        }}
                        disabled={isSaving}
                        className={`w-24 px-2 py-1 border border-gray-300 rounded ${isSaving ? 'bg-gray-100' : ''} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              {isEditing ? 'Cancel' : 'Edit Settings'}
            </button>

            <button
              onClick={handleSaveSettings}
              disabled={!isEditing || isSaving}
              className={`px-4 py-2 ${isEditing && !isSaving ? 'bg-indigo-500 text-white rounded-lg hover:bg-indigo-600' : 'bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300'}`}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}