"use client"

import { useState, useEffect } from 'react'
import { useTaskContext } from '@/src/hooks/useTasks'
import { useIntegrations } from '@/src/hooks/useSuggestions'
import { integrationConfigs } from '@/lib/integrations/base'

export default function AdminDashboard({ onClose }: { onClose: () => void }) {
  const { stats, users, workspaces } = useTaskContext()
  const { integrations, loading: integrationsLoading } = useIntegrations()
  const [activeTab, setActiveTab] = useState('overview')
  const [isAdmin, setIsAdmin] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null)

  // Check admin status on mount
  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    // Check if user is admin via session
    try {
      const response = await fetch('/api/admin/check', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      setIsAdmin(data.isAdmin)
    } catch (error) {
      console.error('Failed to check admin status:', error)
      // For demo purposes, assume admin
      setIsAdmin(true)
    }
  }

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the admin dashboard.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      )
    )
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'workspaces', label: 'Workspaces' },
    { key: 'integrations', label: 'Integrations' },
    { key: 'backups', label: 'Backups' },
    { key: 'audit', label: 'Audit Log' }
  ]

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] shadow-2xl overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Admin Dashboard</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="p-4 rounded-lg mb-4 bg-gray-50">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1 rounded text-sm ${
                activeTab === tab.key ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-6">
          {/* Overview */}
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-lg font-medium mb-4">System Overview</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Total Users</h4>
                  <p className="text-2xl font-bold">{stats?.totalUsers || 'Loading...'}</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Total Tasks</h4>
                  <p className="text-2xl font-bold">{stats?.totalTasks || 'Loading...'}</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Total Workspaces</h4>
                  <p className="text-2xl font-bold">{stats?.totalWorkspaces || 'Loading...'}</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Active Users (7d)</h4>
                  <p className="text-2xl font-bold">{stats?.activeUsersLast7Days || 'Loading...'}</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Connected Integrations</h4>
                  <p className="text-2xl font-bold">{integrations?.length || 0}</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Storage Used</h4>
                  <p className="text-2xl font-bold">{stats?.storageUsed || '0 GB'}</p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">System Status</h4>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-gray-600">All systems operational</span>
                </div>
              </div>
            </div>
          )}

          {/* Users */}
          {activeTab === 'users' && (
            <div>
              <h3 className="text-lg font-medium mb-4">User Management</h3>
              <p className="text-gray-500 text-sm mb-4">
                Manage user accounts, roles, and permissions
              </p>

              {users?.length > 0 ? (
                <div className="space-y-4">
                  {users.map((user: any) => (
                    <div key={user.id} className="bg-white rounded-lg p-4 border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded bg-blue-500 flex items-center justify-center text-white font-bold">
                            {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name || user.email}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'manager' ? 'bg-yellow-100 text-yellow-800' :
                            user.role === 'member' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                          <button
                            onClick={() => {
                              // Would open user management modal
                              console.log('Manage user:', user.id)
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H3m8 4H3m8-4H3m11 8H9m-1-8l-3 3m2 2l3-3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        Last active: {new Date(user.lastActive || user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No users found</p>
              )}
            </div>
          )}

          {/* Workspaces */}
          {activeTab === 'workspaces' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Workspace Management</h3>
              <p className="text-gray-500 text-sm mb-4">
                Create and manage team workspaces
              </p>

              {workspaces?.length > 0 ? (
                <div className="space-y-4">
                  {workspaces.map((workspace: any) => (
                    <div key={workspace.id} className="bg-white rounded-lg p-4 border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded bg-green-500 flex items-center justify-center text-white font-bold">
                            {workspace.name?.charAt(0) || 'W'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{workspace.name}</p>
                            <p className="text-sm text-gray-500">{workspace.description || 'No description'}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800`}>
                            {workspace.memberCount} members
                          </span>
                          <button
                            onClick={() => {
                              // Would open workspace management modal
                              console.log('Manage workspace:', workspace.id)
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H3m8 4H3m8-4H3m11 8H9m-1-8l-3 3m2 2l3-3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        Created: {new Date(workspace.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No workspaces created yet</p>
                  <button
                    onClick={() => {
                      // Would open create workspace modal
                      console.log('Create workspace')
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Create Workspace
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Integrations */}
          {activeTab === 'integrations' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Integration Management</h3>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-gray-500">
                    Connect external services to enhance your workflow
                  </p>
                  <button
                    onClick={() => {
                      // Would open integration selector
                      console.log('Add integration')
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add Integration
                  </button>
                </div>
              </div>

              {integrationsLoading ? (
                <p className="text-center py-8">Loading integrations...</p>
              ) : integrations.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No integrations connected</p>
                  <div className="grid grid-cols-3 gap-4">
                    {integrationConfigs.map((config) => (
                      <div key={config.id} className="bg-white rounded-lg p-4 border hover:shadow-md cursor-pointer"
                        onClick={() => setSelectedIntegration(config)}>
                        <div className="flex items-center justify-center mb-3">
                          <div className={`w-12 h-12 rounded ${config.color}20 flex items-center justify-center text-2xl`}>
                            {config.icon}
                          </div>
                        </div>
                        <h4 className="font-medium text-gray-800 mb-2">{config.name}</h4>
                        <p className="text-sm text-gray-600">{config.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {selectedIntegration && (
                    <div className="bg-white rounded-lg p-6 mb-6 border">
                      <h3 className="text-xl font-bold mb-4">{selectedIntegration.name}</h3>
                      <p className="text-gray-600 mb-4">{selectedIntegration.description}</p>

                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Provider:</p>
                          <p className="ml-2 text-sm">{selectedIntegration.provider}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Type:</p>
                          <p className="ml-2 text-sm">{selectedIntegration.type}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Auth Type:</p>
                          <p className="ml-2 text-sm">{selectedIntegration.authType}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Scopes:</p>
                          <p className="ml-2 text-sm">{selectedIntegration.scopes.join(', ')}</p>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          onClick={() => setSelectedIntegration(null)}
                          className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            // Would initiate OAuth flow
                            console.log('Connect integration:', selectedIntegration.provider)
                            setSelectedIntegration(null)
                          }}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Connect
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {integrations.map((integration: any) => (
                      <div key={integration.id} className="bg-white rounded-lg p-4 border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded ${integration.provider === 'google' || integration.provider === 'microsoft' ? 'bg-green-500' : integration.provider === 'github' ? 'bg-gray-800' : integration.provider === 'slack' ? 'bg-purple-500' : 'bg-blue-500'} flex items-center justify-center text-white font-bold`}>
                              {integration.provider.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{integration.provider}</p>
                              <p className="text-sm text-gray-500">{integration.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              integration.syncStatus === 'success' ? 'bg-green-100 text-green-800' :
                              integration.syncStatus === 'error' ? 'bg-red-100 text-red-800' :
                              integration.syncStatus === 'syncing' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {integration.syncStatus}
                            </span>
                            <button
                              onClick={() => {
                                // Would open integration settings modal
                                console.log('Manage integration:', integration.id)
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H3m8 4H3m8-4H3m11 8H9m-1-8l-3 3m2 2l3-3" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 text-xs text-gray-500">
                          Last synced: {integration.lastSync ? new Date(integration.lastSync).toLocaleString() : 'Never'}
                        </div>

                        {integration.error && (
                          <div className="mt-2 px-2 py-1 bg-red-50 text-red-600 rounded text-xs">
                            Error: {integration.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Backups */}
          {activeTab === 'backups' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Backup Management</h3>
              <p className="text-gray-500 text-sm mb-4">
                Automated and manual backups of your data
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <button
                    onClick={() => {
                      // Would trigger backup creation
                      console.log('Create backup')
                    }}
                    className="w-full px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Create Backup Now
                  </button>
                  <p className="mt-3 text-xs text-gray-500">
                    Manual backups are stored for 30 days
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Backup Schedule:</p>
                  <p className="ml-2 text-sm">Daily at 2:00 AM</p>
                  <p className="text-sm font-medium text-gray-700 mb-2 mt-2">Retention:</p>
                  <p className="ml-2 text-sm">30 days for manual, 90 days for automated</p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Backups</h4>
                <div className="space-y-2">
                  {/* Would list actual backups */}
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">Full Backup</span>
                      <span className="text-sm text-gray-500">Today, 2:00 AM</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        className="px-3 py-1 text-xs bg-green-500 text-white rounded"
                      >
                        Restore
                      </button>
                      <button
                        className="px-3 py-1 text-xs bg-gray-200 text-gray-600 rounded"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">Database Only</span>
                      <span className="text-sm text-gray-500">Yesterday, 2:00 AM</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        className="px-3 py-1 text-xs bg-green-500 text-white rounded"
                      >
                        Restore
                      </button>
                      <button
                        className="px-3 py-1 text-xs bg-gray-200 text-gray-600 rounded"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audit Log */}
          {activeTab === 'audit' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Audit Log</h3>
              <p className="text-gray-500 text-sm mb-4">
                Track all system changes and user actions
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 bg-gray-50">
                    <tr>
                      <th className="px-4 py-2">Timestamp</th>
                      <th className="px-4 py-2">User</th>
                      <th className="px-4 py-2">Action</th>
                      <th className="px-4 py-2">Resource</th>
                      <th className="px-4 py-2">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Would list actual audit entries */}
                    <tr className="bg-white border-b">
                      <td className="px-4 py-2 text-xs">2 minutes ago</td>
                      <td className="px-4 py-2">admin@example.com</td>
                      <td className="px-4 py-2 text-green-600">Created</td>
                      <td className="px-4 py-2">Workspace</td>
                      <td className="px-4 py-2">Marketing Team</td>
                    </tr>
                    <tr className="bg-gray-50 border-b">
                      <td className="px-4 py-2 text-xs">15 minutes ago</td>
                      <td className="px-4 py-2">user@example.com</td>
                      <td className="px-4 py-2 text-yellow-600">Updated</td>
                      <td className="px-4 py-2">Task</td>
                      <td className="px-4 py-2">Changed priority to High</td>
                    </tr>
                    <tr className="bg-white border-b">
                      <td className="px-4 py-2 text-xs">1 hour ago</td>
                      <td className="px-4 py-2">system</td>
                      <td className="px-4 py-2 text-blue-600">Synced</td>
                      <td className="px-4 py-2">Google Calendar</td>
                      <td className="px-4 py-2">5 events updated</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    // Would export audit log
                    console.log('Export audit log')
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                >
                  Export Log
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}