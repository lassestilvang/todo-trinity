// API Client for Todo Trinity
// Centralized API calls with proper error handling

interface ApiError {
  error: string
  message: string
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      error: 'Unknown error',
      message: response.statusText,
    }))
    throw new Error(errorData.message || errorData.error || 'Request failed')
  }
  return response.json()
}

export const api = {
  // Tasks
  getTasks: async (params?: {
    listId?: string
    status?: string
    priority?: string
    search?: string
    labelId?: string
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: string
  }): Promise<{ tasks: any[]; meta: any }> => {
    const searchParams = new URLSearchParams()
    if (params?.listId) searchParams.append('listId', params.listId)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.priority) searchParams.append('priority', params.priority)
    if (params?.search) searchParams.append('search', params.search)
    if (params?.labelId) searchParams.append('labelId', params.labelId)
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder)

    const response = await fetch(`/api/tasks?${searchParams.toString()}`)
    return handleResponse(response)
  },

  createTask: async (taskData: {
    title: string
    description?: string
    status: string
    priority: string
    dueDate?: string
    listId?: string
    labelIds?: string[]
  }): Promise<{ task: any }> => {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    })
    return handleResponse(response)
  },

  updateTask: async (id: string, updates: any): Promise<{ task: any }> => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    return handleResponse(response)
  },

  deleteTask: async (id: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
    })
    return handleResponse(response)
  },

  // Lists
  getLists: async (): Promise<{ lists: any[] }> => {
    const response = await fetch('/api/user-lists')
    return handleResponse(response)
  },

  createList: async (listData: { name: string; color?: string; icon?: string }): Promise<{ list: any }> => {
    const response = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listData),
    })
    return handleResponse(response)
  },

  updateList: async (id: string, updates: any): Promise<{ list: any }> => {
    const response = await fetch(`/api/lists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    return handleResponse(response)
  },

  deleteList: async (id: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/lists/${id}`, {
      method: 'DELETE',
    })
    return handleResponse(response)
  },

  // Labels
  getLabels: async (): Promise<{ labels: any[] }> => {
    const response = await fetch('/api/user-labels')
    return handleResponse(response)
  },

  createLabel: async (labelData: { name: string; color?: string }): Promise<{ label: any }> => {
    const response = await fetch('/api/labels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(labelData),
    })
    return handleResponse(response)
  },

  updateLabel: async (id: string, updates: any): Promise<{ label: any }> => {
    const response = await fetch(`/api/labels/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    return handleResponse(response)
  },

  deleteLabel: async (id: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/labels/${id}`, {
      method: 'DELETE',
    })
    return handleResponse(response)
  },

  // Notifications
  getNotifications: async (): Promise<{ notifications: any[] }> => {
    const response = await fetch('/api/notifications')
    return handleResponse(response)
  },

  createNotification: async (notificationData: any): Promise<{ notification: any }> => {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationData),
    })
    return handleResponse(response)
  },

  markNotificationAsRead: async (id: string): Promise<{ notification: any }> => {
    const response = await fetch(`/api/notifications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true }),
    })
    return handleResponse(response)
  },

  // Gamification
  getGamification: async (userId: string): Promise<any> => {
    const response = await fetch(`/api/gamification?userId=${userId}`)
    return handleResponse(response)
  },

  // Suggestions
  getSuggestions: async (userId: string): Promise<{ suggestions: any[] }> => {
    const response = await fetch(`/api/suggestions?userId=${userId}`)
    return handleResponse(response)
  },

  parseNaturalLanguage: async (text: string, userId: string): Promise<{ parsed: any }> => {
    const response = await fetch('/api/suggestions/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, userId }),
    })
    return handleResponse(response)
  },

  // Search
  getSearch: async (query: string): Promise<{ results: any }> => {
    const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`)
    return handleResponse(response)
  },

  // User Stats
  getUserStats: async (userId: string): Promise<any> => {
    const response = await fetch(`/api/user-stats?userId=${userId}`)
    return handleResponse(response)
  },

  // Views
  getViews: async (viewType: string): Promise<any[]> => {
    const response = await fetch(`/api/views?viewType=${viewType}`)
    return handleResponse(response)
  },

  // Auth
  getAuth: async (): Promise<{ user: any }> => {
    const response = await fetch('/api/auth')
    return handleResponse(response)
  },

  login: async (credentials: { email: string; password: string }): Promise<{ user: any }> => {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })
    return handleResponse(response)
  },

  signup: async (userData: {
    email: string
    name?: string
    password: string
  }): Promise<{ user: any }> => {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    })
    return handleResponse(response)
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await fetch('/api/auth/signout', {
      method: 'POST',
    })
    return handleResponse(response)
  },

  // Comments
  getComments: async (taskId: string): Promise<{ comments: any[] }> => {
    const response = await fetch(`/api/comments?taskId=${taskId}`)
    return handleResponse(response)
  },

  createComment: async (commentData: any): Promise<{ comment: any }> => {
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentData),
    })
    return handleResponse(response)
  },

  updateComment: async (id: string, updates: any): Promise<{ comment: any }> => {
    const response = await fetch(`/api/comments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    return handleResponse(response)
  },

  deleteComment: async (id: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/comments/${id}`, {
      method: 'DELETE',
    })
    return handleResponse(response)
  },

  // Activity
  getActivity: async (userId: string): Promise<{ activity: any[] }> => {
    const response = await fetch(`/api/activity?userId=${userId}`)
    return handleResponse(response)
  },

  // Analytics
  getAnalytics: async (userId: string, params?: any): Promise<any> => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value))
      })
    }
    const response = await fetch(`/api/analytics?${searchParams.toString()}`)
    return handleResponse(response)
  },

  // Integrations
  getIntegrations: async (): Promise<{ integrations: any[] }> => {
    const response = await fetch('/api/integrations')
    return handleResponse(response)
  },

  connectIntegration: async (integrationData: any): Promise<{ integration: any }> => {
    const response = await fetch('/api/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(integrationData),
    })
    return handleResponse(response)
  },

  // Export/Import
  exportData: async (params: any): Promise<any> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, String(value))
    })
    const response = await fetch(`/api/export?${searchParams.toString()}`)
    return handleResponse(response)
  },

  importData: async (file: File): Promise<{ message: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch('/api/import', {
      method: 'POST',
      body: formData,
    })
    return handleResponse(response)
  },

  // Settings
  getSettings: async (): Promise<any> => {
    const response = await fetch('/api/settings')
    return handleResponse(response)
  },

  updateSettings: async (settings: any): Promise<any> => {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    return handleResponse(response)
  },

  // Admin
  getAdminStats: async (): Promise<any> => {
    const response = await fetch('/api/admin/stats')
    return handleResponse(response)
  },

  getAdminUsers: async (): Promise<{ users: any[] }> => {
    const response = await fetch('/api/admin/users')
    return handleResponse(response)
  },

  getAdminWorkspaces: async (): Promise<{ workspaces: any[] }> => {
    const response = await fetch('/api/admin/workspaces')
    return handleResponse(response)
  },

  // Subtasks
  getSubTasks: async (taskId: string): Promise<{ subtasks: any[] }> => {
    const response = await fetch(`/api/tasks/${taskId}/subtasks`)
    return handleResponse(response)
  },

  createSubTask: async (subTaskData: { title: string; taskId: string }): Promise<{ subtask: any }> => {
    const response = await fetch(`/api/tasks/${subTaskData.taskId}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subTaskData),
    })
    return handleResponse(response)
  },

  updateSubTask: async (taskId: string, subTaskId: string, updates: any): Promise<{ subtask: any }> => {
    const response = await fetch(`/api/tasks/${taskId}/subtasks/${subTaskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    return handleResponse(response)
  },

  deleteSubTask: async (taskId: string, subTaskId: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/tasks/${taskId}/subtasks/${subTaskId}`, {
      method: 'DELETE',
    })
    return handleResponse(response)
  },

  // Task Dependencies
  getTaskDependencies: async (taskId: string): Promise<{ dependencies: any[] }> => {
    const response = await fetch(`/api/task-dependencies?taskId=${taskId}`)
    return handleResponse(response)
  },

  createTaskDependency: async (dependencyData: { taskId: string; dependsOnId: string }): Promise<{ dependency: any }> => {
    const response = await fetch('/api/task-dependencies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dependencyData),
    })
    return handleResponse(response)
  },

  deleteTaskDependency: async (taskId: string, dependsOnId: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/task-dependencies?taskId=${taskId}&dependsOnId=${dependsOnId}`, {
      method: 'DELETE',
    })
    return handleResponse(response)
  },

  // Saved Searches
  getSavedSearches: async (): Promise<{ searches: any[] }> => {
    const response = await fetch('/api/search/saved')
    return handleResponse(response)
  },

  saveSearch: async (searchData: { name: string; filters?: any; query?: string }): Promise<{ search: any }> => {
    const response = await fetch('/api/search/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchData),
    })
    return handleResponse(response)
  },

  deleteSearch: async (name: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/search/saved?name=${encodeURIComponent(name)}`, {
      method: 'DELETE',
    })
    return handleResponse(response)
  },

  // Mentions
  getMentions: async (): Promise<{ mentions: any[] }> => {
    const response = await fetch('/api/mentions')
    return handleResponse(response)
  },

  markMentionsAsRead: async (): Promise<{ message: string }> => {
    const response = await fetch('/api/mentions', {
      method: 'PUT',
    })
    return handleResponse(response)
  },

  // Task Analytics
  getTaskAnalytics: async (taskId: string): Promise<any> => {
    const response = await fetch(`/api/tasks/${taskId}/analytics`)
    return handleResponse(response)
  },

  // Templates
  getTemplates: async (): Promise<{ templates: any[] }> => {
    const response = await fetch('/api/templates')
    return handleResponse(response)
  },

  createTemplate: async (templateData: { name: string; description?: string; category?: string; icon?: string; color?: string; tasks: any[] }): Promise<{ template: any }> => {
    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateData),
    })
    return handleResponse(response)
  },

  applyTemplate: async (templateId: string, listId?: string): Promise<{ message: string; tasks: any[] }> => {
    const searchParams = new URLSearchParams()
    searchParams.append('id', templateId)
    if (listId) searchParams.append('listId', listId)
    const response = await fetch(`/api/templates?${searchParams.toString()}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    })
    return handleResponse(response)
  },

  // Calendar Sync
  getCalendarSync: async (provider: string = 'google'): Promise<any> => {
    const response = await fetch(`/api/integrations/calendar/sync?provider=${provider}`)
    return handleResponse(response)
  },

  updateCalendarSync: async (provider: string, enabled: boolean): Promise<any> => {
    const response = await fetch('/api/integrations/calendar/sync', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, enabled }),
    })
    return handleResponse(response)
  },

  manualCalendarSync: async (provider: string = 'google'): Promise<any> => {
    const response = await fetch(`/api/integrations/calendar/sync/manual?provider=${provider}`, {
      method: 'POST',
    })
    return handleResponse(response)
  },
}

export default api