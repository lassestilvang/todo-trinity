"use client"

import { useState, useEffect } from 'react'
import { useIntegrations } from '@/src/hooks/useIntegrations'
import { IntegrationConfig, integrationConfigs, Integration } from '@/lib/integrations/base'
import { cn } from '@/src/lib/utils'

interface IntegrationHubProps {
  onClose?: () => void
}

type TabType = 'connected' | 'available' | 'webhooks' | 'templates'

export default function IntegrationHub({ onClose }: IntegrationHubProps) {
  const { integrations, loading, error, connectIntegration, disconnectIntegration, syncIntegration } = useIntegrations()
  const [activeTab, setActiveTab] = useState<TabType>('connected')
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set())

  // Filter to only available (not yet connected) integrations
  const connectedProviders = integrations.map((i) => i.provider)
  const availableIntegrations = integrationConfigs.filter(
    (config) => !connectedProviders.includes(config.provider)
  )

  const handleConnect = async (config: IntegrationConfig) => {
    try {
      await connectIntegration(config.provider, {
        apiKey: 'temp_key_placeholder',
      })
    } catch (err) {
      console.error('Failed to connect integration:', err)
    }
  }

  const handleDisconnect = async (provider: string) => {
    try {
      await disconnectIntegration(provider)
    } catch (err) {
      console.error('Failed to disconnect integration:', err)
    }
  }

  const handleSync = async (provider: string) => {
    setSyncingIds((prev) => {
      const next = new Set(prev)
      next.add(provider)
      return next
    })
    try {
      await syncIntegration(provider)
    } catch (err) {
      console.error('Failed to sync integration:', err)
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev)
        next.delete(provider)
        return next
      })
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'slack':
        return 'bg-purple-500'
      case 'github':
        return 'bg-gray-800'
      case 'jira':
        return 'bg-blue-600'
      case 'asana':
        return 'bg-green-600'
      case 'monday-com':
        return 'bg-orange-500'
      case 'trello':
        return 'bg-blue-500'
      case 'notion':
        return 'bg-gray-900'
      case 'google':
        return 'bg-green-500'
      case 'microsoft':
        return 'bg-blue-600'
      default:
        return 'bg-blue-500'
    }
  }

  const tabs = [
    { key: 'connected', label: 'Connected' },
    { key: 'available', label: 'Available' },
    { key: 'webhooks', label: 'Webhooks' },
    { key: 'templates', label: 'Templates' },
  ]

  const getConnectedIntegration = (provider: string): Integration | undefined => {
    return integrations.find((i) => i.provider === provider)
  }

  // Get integration data for display
  const getIntegrationData = (provider: string) => {
    const connectedIntegration = getConnectedIntegration(provider)
    if (connectedIntegration) {
      return {
        config: connectedIntegration.config,
        isConnected: connectedIntegration.connected || false,
        syncStatus: connectedIntegration.syncStatus,
        lastSync: connectedIntegration.lastSync,
        error: connectedIntegration.error,
      }
    }
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Integration Marketplace</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="px-6 bg-gray-50 border-b border-gray-200">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
                  activeTab === tab.key
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          {(activeTab === 'connected' || activeTab === 'available') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(activeTab === 'connected' ? integrations : availableIntegrations).map((item: Integration | IntegrationConfig) => {
                if ('config' in item) {
                  // It's an Integration
                  return (
                    <div
                      key={item.provider}
                      className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-10 h-10 rounded ${getProviderColor(item.provider)} flex items-center justify-center text-white text-xl`}
                        >
                          {item.config.icon}
                        </div>
                        <span
                          className={cn(
                            'px-2 py-1 text-xs rounded-full',
                            item.connected
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          )}
                        >
                          {item.connected ? 'Connected' : 'Available'}
                        </span>
                      </div>

                      <h3 className="font-semibold text-gray-900 mb-1">{item.config.name}</h3>
                      <p className="text-sm text-gray-500 mb-3 h-16 overflow-hidden">{item.config.description}</p>

                      {item.connected && item.syncStatus && (
                        <div className="mb-3">
                          <span
                            className={cn(
                              'text-xs px-2 py-1 rounded',
                              item.syncStatus === 'success'
                                ? 'bg-green-100 text-green-800'
                                : item.syncStatus === 'error'
                                ? 'bg-red-100 text-red-800'
                                : item.syncStatus === 'syncing'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-600'
                            )}
                          >
                            {item.syncStatus}
                          </span>
                          {item.lastSync && (
                            <span className="text-xs text-gray-400 ml-2">
                              Last sync: {new Date(item.lastSync).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      )}

                      {item.error && (
                        <div className="mb-3 p-2 bg-red-50 text-red-600 text-xs rounded">
                          Error: {item.error}
                        </div>
                      )}

                      <div className="flex space-x-2">
                        {item.connected ? (
                          <>
                            <button
                              onClick={() => handleSync(item.provider)}
                              disabled={syncingIds.has(item.provider)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                            >
                              {syncingIds.has(item.provider) ? 'Syncing...' : 'Sync Now'}
                            </button>
                            <button
                              onClick={() => handleDisconnect(item.provider)}
                              className="flex-1 px-3 py-2 bg-gray-100 text-red-600 rounded text-sm hover:bg-gray-200"
                            >
                              Disconnect
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleConnect(item.config)}
                            className={cn(
                              'w-full px-3 py-2 rounded text-sm font-medium text-white',
                              getProviderColor(item.provider).replace('bg-', 'bg-').replace('-500', '-600'),
                              getProviderColor(item.provider).replace('bg-', 'hover:bg-').replace('-500', '-700')
                            )}
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  )
                } else {
                  // It's an IntegrationConfig
                  return (
                    <div
                      key={item.provider}
                      className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-10 h-10 rounded ${getProviderColor(item.provider)} flex items-center justify-center text-white text-xl`}
                        >
                          {item.icon}
                        </div>
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                          Available
                        </span>
                      </div>

                      <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                      <p className="text-sm text-gray-500 mb-3 h-16 overflow-hidden">{item.description}</p>

                      <button
                        onClick={() => handleConnect(item)}
                        className={cn(
                          'w-full px-3 py-2 rounded text-sm font-medium text-white',
                          getProviderColor(item.provider).replace('bg-', 'bg-').replace('-500', '-600'),
                          getProviderColor(item.provider).replace('bg-', 'hover:bg-').replace('-500', '-700')
                        )}
                      >
                        Connect
                      </button>
                    </div>
                  )
                }
              })}
            </div>
          )}

          {activeTab === 'webhooks' && (
            <WebhookManagement />
          )}

          {activeTab === 'templates' && (
            <IntegrationTemplates />
          )}
        </div>
      </div>
    </div>
  )
}

function WebhookManagement() {
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWebhooks()
  }, [])

  const fetchWebhooks = async () => {
    try {
      const response = await fetch('/api/integrations/webhooks')
      const data = await response.json()
      setWebhooks(data.webhooks || [])
    } catch (err) {
      console.error('Failed to fetch webhooks:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Webhook Management</h3>
        <button
          onClick={() => {}}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Webhook
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading webhooks...</p>
      ) : webhooks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No webhooks configured</p>
          <p className="text-sm text-gray-400 mt-2">
            Webhooks allow external services to push data to Todo Trinity
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{webhook.name}</h4>
                  <p className="text-sm text-gray-500">{webhook.url}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span
                      className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        webhook.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {webhook.active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-gray-400">
                      Events: {webhook.events?.join(', ') || 'all'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
                    Edit
                  </button>
                  <button className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function IntegrationTemplates() {
  const templates = [
    {
      id: 'project-management-sync',
      name: 'Project Management Sync',
      description: 'Automatically sync tasks between Todo Trinity and your PM tool (Jira, Asana, Trello)',
      icon: '🔄',
      category: 'productivity',
      popular: true,
    },
    {
      id: 'calendar-sync',
      name: 'Calendar Sync',
      description: 'Two-way sync between tasks and calendar events (Google Calendar, Outlook)',
      icon: '📅',
      category: 'calendar',
      popular: true,
    },
    {
      id: 'team-notifications',
      name: 'Team Notifications',
      description: 'Send task updates to team channels (Slack, Discord, Teams)',
      icon: '🔔',
      category: 'communication',
      popular: true,
    },
    {
      id: 'auto-backup',
      name: 'Auto Backup',
      description: 'Automatically backup task data to cloud storage (Google Drive, Dropbox)',
      icon: '💾',
      category: 'storage',
      popular: false,
    },
    {
      id: 'zapier-automation',
      name: 'Zapier Automation',
      description: 'Use Zapier to connect to 5000+ apps for powerful automations',
      icon: '⚡',
      category: 'automation',
      popular: false,
    },
  ]

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Integration Templates</h3>
      <p className="text-sm text-gray-500 mb-4">
        Pre-built templates to quickly set up common integration workflows
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className={cn(
              'bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow',
              template.popular ? 'border-blue-200' : ''
            )}
          >
            {template.popular && (
              <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full mb-2">
                Popular
              </span>
            )}
            <div className="text-3xl mb-3">{template.icon}</div>
            <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
            <p className="text-sm text-gray-500 mb-3 h-20 overflow-hidden">{template.description}</p>
            <button className="w-full px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
              Use Template
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export { IntegrationHub }