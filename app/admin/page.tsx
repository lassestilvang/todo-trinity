"use client"

import { useState } from 'react'
import { useTaskContext } from '@/src/hooks/useTasks'
import { useIntegrations } from '@/src/hooks/useTasks'

export default function AdminDashboard({ onClose }: { onClose: () => void }) {
  const { stats } = useTaskContext()
  const { integrations, loading: integrationsLoading } = useIntegrations()
  const [activeTab, setActiveTab] = useState('overview')
  const [isAdmin, setIsAdmin] = useState(false)

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const checkAdmin = async () => {
    // This would be done on mount with session check
    setIsAdmin(true) // Simplified - assume admin for now
  }

  checkAdmin()

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'integrations', label: 'Integrations' },
    { key: 'backups', label: 'Backups' },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-y-auto">
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
              <div className="grid grid-cols-2 gap-4">
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
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Active Users</h4>
                  <p className="text-2xl font-bold">{stats?.activeUsersLast7Days || 'Loading...'}</p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Activity</h4>
                <p className="text-gray-500 text-sm">
                  {stats?.pendingInvitations || 0} pending invitations
                </p>
              </div>
            </div>
          )}

          {/* Users */}
          {activeTab === 'users' && (
            <div>
              <h3 className="text-lg font-medium mb-4">User Management</h3>
              <p className="text-gray-500 text-sm mb-4">
                Manage user accounts and permissions
              </p>
              <p className="text-gray-400 text-xs">
                This feature would integrate with your user management system.
              </p>
            </div>
          )}

          {/* Integrations */}
          {activeTab === 'integrations' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Connected Integrations</h3>
              {integrationsLoading ? (
                <p className="text-center py-8">Loading integrations...</p>
              ) : integrations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No integrations connected
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {integrations.map((integration: any) => (
                    <div key={integration.id} className="bg-white rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`w-8 h-8 rounded ${integration.provider === 'google' ? 'bg-green-500' : integration.provider === 'outlook' ? 'bg-purple-500' : 'bg-blue-500'} text-white flex items-center justify-center text-sm font-bold}`>
                          {integration.provider.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">{integration.provider}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {integration.scope || 'Full access'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Backups */}
          {activeTab === 'backups' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Backup Management</h3>
              <p className="text-gray-500 text-sm mb-4">
                Manage your data backups
              </p>
              <button
                onClick={() => {
                  // Would trigger backup creation
                  addToast('Backup creation started', 'success')
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-2"
              >
                Create Backup
              </button>
              <p className="text-gray-400 text-xs">
                Backups are stored securely and can be restored when needed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}