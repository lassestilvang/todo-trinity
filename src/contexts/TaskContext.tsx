"use client"

import { createContext, useContext, ReactNode, useReducer, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Task, List, Label, User, TaskStatus, Priority } from '@/src/types/index'
import { TaskContextType } from '@/src/types/index'

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// API helper functions
const api = {
  getTasks: async (params?: {
    listId?: string
    status?: TaskStatus
    priority?: Priority
    search?: string
    labelId?: string
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: string
  }) => {
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

    const url = `/api/tasks?${searchParams.toString()}`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch tasks')
    }
    return response.json()
  },

  createTask: async (taskData: {
    title: string
    description?: string
    status: TaskStatus
    priority: Priority
    dueDate?: string
    listId?: string
    labelIds?: string[]
  }) => {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    })
    if (!response.ok) {
      throw new Error('Failed to create task')
    }
    return response.json()
  },

  updateTask: async (id: string, updates: Partial<Task>) => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!response.ok) {
      throw new Error('Failed to update task')
    }
    return response.json()
  },

  deleteTask: async (id: string) => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete task')
    }
    return response.json()
  },

  getLists: async () => {
    const response = await fetch('/api/user-lists')
    if (!response.ok) {
      throw new Error('Failed to fetch lists')
    }
    return response.json()
  },

  createList: async (listData: { name: string; color?: string; icon?: string }) => {
    const response = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listData),
    })
    if (!response.ok) {
      throw new Error('Failed to create list')
    }
    return response.json()
  },

  updateList: async (id: string, updates: Partial<List>) => {
    const response = await fetch(`/api/lists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!response.ok) {
      throw new Error('Failed to update list')
    }
    return response.json()
  },

  deleteList: async (id: string) => {
    const response = await fetch(`/api/lists/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete list')
    }
    return response.json()
  },

  getLabels: async () => {
    const response = await fetch('/api/user-labels')
    if (!response.ok) {
      throw new Error('Failed to fetch labels')
    }
    return response.json()
  },

  createLabel: async (labelData: { name: string; color?: string }) => {
    const response = await fetch('/api/labels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(labelData),
    })
    if (!response.ok) {
      throw new Error('Failed to create label')
    }
    return response.json()
  },

  updateLabel: async (id: string, updates: Partial<Label>) => {
    const response = await fetch(`/api/labels/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!response.ok) {
      throw new Error('Failed to update label')
    }
    return response.json()
  },

  deleteLabel: async (id: string) => {
    const response = await fetch(`/api/labels/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete label')
    }
    return response.json()
  },

  getNotifications: async () => {
    const response = await fetch('/api/notifications')
    if (!response.ok) {
      throw new Error('Failed to fetch notifications')
    }
    return response.json()
  },

  createNotification: async (notificationData: any) => {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationData),
    })
    if (!response.ok) {
      throw new Error('Failed to create notification')
    }
    return response.json()
  },

  markNotificationAsRead: async (id: string) => {
    const response = await fetch(`/api/notifications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true }),
    })
    if (!response.ok) {
      throw new Error('Failed to mark notification as read')
    }
    return response.json()
  },

  getGamification: async (userId: string) => {
    const response = await fetch(`/api/gamification?userId=${userId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch gamification data')
    }
    return response.json()
  },

  getSuggestions: async (userId: string) => {
    const response = await fetch(`/api/suggestions?userId=${userId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch suggestions')
    }
    return response.json()
  },

  parseNaturalLanguage: async (text: string, userId: string) => {
    const response = await fetch(`/api/suggestions/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, userId }),
    })
    if (!response.ok) {
      throw new Error('Failed to parse natural language')
    }
    return response.json()
  },

  getSearch: async (query: string) => {
    const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`)
    if (!response.ok) {
      throw new Error('Failed to search')
    }
    return response.json()
  },

  getUserStats: async (userId: string) => {
    const response = await fetch(`/api/user-stats?userId=${userId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch user stats')
    }
    return response.json()
  },

  getViews: async (viewType: string) => {
    const response = await fetch(`/api/views?viewType=${viewType}`)
    if (!response.ok) {
      throw new Error('Failed to fetch view')
    }
    return response.json()
  },

  getAuth: async () => {
    const response = await fetch('/api/auth')
    if (!response.ok) {
      throw new Error('Failed to fetch auth')
    }
    return response.json()
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })
    if (!response.ok) {
      throw new Error('Login failed')
    }
    return response.json()
  },

  signup: async (userData: {
    email: string
    name?: string
    password: string
  }) => {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    })
    if (!response.ok) {
      throw new Error('Signup failed')
    }
    return response.json()
  },

  logout: async () => {
    const response = await fetch('/api/auth/signout', {
      method: 'POST',
    })
    if (!response.ok) {
      throw new Error('Logout failed')
    }
    return response.json()
  },

  getComments: async (taskId: string) => {
    const response = await fetch(`/api/comments?taskId=${taskId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch comments')
    }
    return response.json()
  },

  createComment: async (commentData: any) => {
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentData),
    })
    if (!response.ok) {
      throw new Error('Failed to create comment')
    }
    return response.json()
  },

  updateComment: async (id: string, updates: any) => {
    const response = await fetch(`/api/comments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!response.ok) {
      throw new Error('Failed to update comment')
    }
    return response.json()
  },

  deleteComment: async (id: string) => {
    const response = await fetch(`/api/comments/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete comment')
    }
    return response.json()
  },

  getActivity: async (userId: string) => {
    const response = await fetch(`/api/activity?userId=${userId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch activity')
    }
    return response.json()
  },

  getAnalytics: async (userId: string, params?: any) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value))
      })
    }
    const response = await fetch(`/api/analytics?${searchParams.toString()}`)
    if (!response.ok) {
      throw new Error('Failed to fetch analytics')
    }
    return response.json()
  },

  getIntegrations: async (): Promise<{ integrations: any[] }> => {
    const response = await fetch('/api/integrations')
    if (!response.ok) {
      throw new Error('Failed to fetch integrations')
    }
    return response.json()
  },

  connectIntegration: async (integrationData: any): Promise<{ integration: any }> => {
    const response = await fetch('/api/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(integrationData),
    })
    if (!response.ok) {
      throw new Error('Failed to connect integration')
    }
    return response.json()
  },

  disconnectIntegration: async (provider: string): Promise<{ message: string }> => {
    const response = await fetch('/api/integrations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    })
    if (!response.ok) {
      throw new Error('Failed to disconnect integration')
    }
    return response.json()
  },

  exportData: async (params: any): Promise<any> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, String(value))
    })
    const response = await fetch(`/api/export?${searchParams.toString()}`)
    if (!response.ok) {
      throw new Error('Failed to export data')
    }
    return response.json()
  },

  importData: async (file: File): Promise<{ message: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch('/api/import', {
      method: 'POST',
      body: formData,
    })
    if (!response.ok) {
      throw new Error('Failed to import data')
    }
    return response.json()
  },

  getSettings: async (): Promise<any> => {
    const response = await fetch('/api/settings')
    if (!response.ok) {
      throw new Error('Failed to fetch settings')
    }
    return response.json()
  },

  updateSettings: async (settings: any): Promise<any> => {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    if (!response.ok) {
      throw new Error('Failed to update settings')
    }
    return response.json()
  },

  getBackups: async (): Promise<{ backups: any[] }> => {
    const response = await fetch('/api/backup')
    if (!response.ok) {
      throw new Error('Failed to fetch backups')
    }
    return response.json()
  },

  createBackup: async (type: string): Promise<{ backup: any }> => {
    const response = await fetch('/api/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    })
    if (!response.ok) {
      throw new Error('Failed to create backup')
    }
    return response.json()
  },

  getAdminStats: async (): Promise<any> => {
    const response = await fetch('/api/admin/stats')
    if (!response.ok) {
      throw new Error('Failed to fetch admin stats')
    }
    return response.json()
  },

  getAdminUsers: async (): Promise<{ users: any[] }> => {
    const response = await fetch('/api/admin/users')
    if (!response.ok) {
      throw new Error('Failed to fetch admin users')
    }
    return response.json()
  },

  getAdminWorkspaces: async (): Promise<{ workspaces: any[] }> => {
    const response = await fetch('/api/admin/workspaces')
    if (!response.ok) {
      throw new Error('Failed to fetch admin workspaces')
    }
    return response.json()
  },

  getCalendarSync: async (provider: string): Promise<any> => {
    const response = await fetch(`/api/integrations/calendar/sync?provider=${provider}`)
    if (!response.ok) {
      throw new Error('Failed to fetch calendar sync')
    }
    return response.json()
  },

  updateCalendarSync: async (provider: string, enabled: boolean): Promise<any> => {
    const response = await fetch('/api/integrations/calendar/sync', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, enabled }),
    })
    if (!response.ok) {
      throw new Error('Failed to update calendar sync')
    }
    return response.json()
  },
}

// Initial state
interface TaskState {
  tasks: Task[]
  lists: List[]
  labels: Label[]
  notifications: any[]
  loading: boolean
  error: string | null
  selectedList: string
  selectedStatus: TaskStatus
  selectedPriority: Priority
  selectedLabel: string
  viewType: string
  filters: {
    listId?: string
    status?: TaskStatus
    priority?: Priority
    search?: string
    labelId?: string
  }
}

const initialState: TaskState = {
  tasks: [],
  lists: [],
  labels: [],
  notifications: [],
  loading: false,
  error: null,
  selectedList: '',
  selectedStatus: TaskStatus.TODO,
  selectedPriority: Priority.NORMAL,
  selectedLabel: '',
  viewType: 'today',
  filters: {},
}

// Reducer function
function taskReducer(state: TaskState, action: any): TaskState {
  switch (action.type) {
    case 'SET_TASKS':
      return { ...state, tasks: action.payload, loading: false, error: null }
    case 'SET_LISTS':
      return { ...state, lists: action.payload, loading: false, error: null }
    case 'SET_LABELS':
      return { ...state, labels: action.payload, loading: false, error: null }
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload, loading: false, error: null }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    case 'SET_SELECTED_LIST':
      return { ...state, selectedList: action.payload }
    case 'SET_SELECTED_STATUS':
      return { ...state, selectedStatus: action.payload }
    case 'SET_SELECTED_PRIORITY':
      return { ...state, selectedPriority: action.payload }
    case 'SET_SELECTED_LABEL':
      return { ...state, selectedLabel: action.payload }
    case 'SET_VIEW_TYPE':
      return { ...state, viewType: action.payload }
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } }
    case 'CLEAR_FILTERS':
      return { ...state, filters: {} }
    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks] }
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        ),
      }
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      }
    case 'ADD_LIST':
      return { ...state, lists: [action.payload, ...state.lists] }
    case 'UPDATE_LIST':
      return {
        ...state,
        lists: state.lists.map(list =>
          list.id === action.payload.id ? action.payload : list
        ),
      }
    case 'DELETE_LIST':
      return {
        ...state,
        lists: state.lists.filter(list => list.id !== action.payload),
      }
    case 'ADD_LABEL':
      return { ...state, labels: [action.payload, ...state.labels] }
    case 'UPDATE_LABEL':
      return {
        ...state,
        labels: state.labels.map(label =>
          label.id === action.payload.id ? action.payload : label
        ),
      }
    case 'DELETE_LABEL':
      return {
        ...state,
        labels: state.labels.filter(label => label.id !== action.payload),
      }
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] }
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload.id
            ? { ...notification, read: true }
            : notification
        ),
      }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

// Context
const TaskContext = createContext<TaskContextType | undefined>(undefined)

// Provider component
export function TaskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, initialState)
  const queryClient = useQueryClient()

  // Queries
  const { data: tasksData, isLoading: tasksLoading, error: tasksError } = useQuery(
    ['tasks', state.filters],
    () => api.getTasks(state.filters),
    {
      select: (data: any) => data.tasks || [],
      enabled: !!state.selectedList || !!state.selectedStatus || !!state.selectedLabel,
    }
  )

  const { data: listsData } = useQuery(
    ['lists'],
    () => api.getLists(),
    {
      select: (data: any) => data.lists || [],
    }
  )

  const { data: labelsData } = useQuery(
    ['labels'],
    () => api.getLabels(),
    {
      select: (data: any) => data.labels || [],
    }
  )

  const { data: notificationsData } = useQuery(
    ['notifications'],
    () => api.getNotifications(),
    {
      select: (data: any) => data.notifications || [],
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  )

  // Mutations
  const createTaskMutation = useMutation(
    (taskData: any) => api.createTask(taskData),
    {
      onSuccess: (newTask) => {
        queryClient.invalidateQueries(['tasks'])
        dispatch({ type: 'ADD_TASK', payload: newTask.task })
      },
      onError: (error) => {
        dispatch({ type: 'SET_ERROR', payload: error.message })
      },
    }
  )

  const updateTaskMutation = useMutation(
    ({ id, updates }: { id: string; updates: Partial<Task> }) => api.updateTask(id, updates),
    {
      onSuccess: (updatedTask) => {
        queryClient.invalidateQueries(['tasks'])
        dispatch({ type: 'UPDATE_TASK', payload: updatedTask.task })
      },
      onError: (error) => {
        dispatch({ type: 'SET_ERROR', payload: error.message })
      },
    }
  )

  const deleteTaskMutation = useMutation(
    (id: string) => api.deleteTask(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks'])
        dispatch({ type: 'DELETE_TASK', payload: id })
      },
      onError: (error) => {
        dispatch({ type: 'SET_ERROR', payload: error.message })
      },
    }
  )

  const createListMutation = useMutation(
    (listData: any) => api.createList(listData),
    {
      onSuccess: (newList) => {
        queryClient.invalidateQueries(['lists'])
        dispatch({ type: 'ADD_LIST', payload: newList.list })
      },
      onError: (error) => {
        dispatch({ type: 'SET_ERROR', payload: error.message })
      },
    }
  )

  const createLabelMutation = useMutation(
    (labelData: any) => api.createLabel(labelData),
    {
      onSuccess: (newLabel) => {
        queryClient.invalidateQueries(['labels'])
        dispatch({ type: 'ADD_LABEL', payload: newLabel.label })
      },
      onError: (error) => {
        dispatch({ type: 'SET_ERROR', payload: error.message })
      },
    }
  )

  // Action creators
  const fetchTasks = useCallback(async (filters?: any) => {
    if (filters) {
      dispatch({ type: 'SET_FILTERS', payload: filters })
      dispatch({ type: 'SET_LOADING', payload: true })
    } else {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const result = await api.getTasks(state.filters)
        dispatch({ type: 'SET_TASKS', payload: result.tasks })
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
      }
    }
  }, [state.filters])

  const createTask = useCallback(
    (taskData: any) => createTaskMutation.mutate(taskData),
    [createTaskMutation]
  )

  const updateTask = useCallback(
    (id: string, updates: Partial<Task>) => updateTaskMutation.mutate({ id, updates }),
    [updateTaskMutation]
  )

  const deleteTask = useCallback(
    (id: string) => deleteTaskMutation.mutate(id),
    [deleteTaskMutation]
  )

  const createList = useCallback(
    (listData: any) => createListMutation.mutate(listData),
    [createListMutation]
  )

  const createLabel = useCallback(
    (labelData: any) => createLabelMutation.mutate(labelData),
    [createLabelMutation]
  )

  const updateList = useCallback(async (id: string, listData: Partial<List>) => {
    const result = await api.updateList(id, listData)
    dispatch({ type: 'UPDATE_LIST', payload: result.list })
  }, [])

  const deleteList = useCallback(async (id: string) => {
    await api.deleteList(id)
    dispatch({ type: 'DELETE_LIST', payload: id })
  }, [])

  const updateLabel = useCallback(async (id: string, labelData: Partial<Label>) => {
    const result = await api.updateLabel(id, labelData)
    dispatch({ type: 'UPDATE_LABEL', payload: result.label })
  }, [])

  const deleteLabel = useCallback(async (id: string) => {
    await api.deleteLabel(id)
    dispatch({ type: 'DELETE_LABEL', payload: id })
  }, [])

  const createNotification = useCallback(async (notificationData: any) => {
    const result = await api.createNotification(notificationData)
    dispatch({ type: 'ADD_NOTIFICATION', payload: result.notification })
  }, [])

  const markNotificationAsRead = useCallback(async (id: string) => {
    await api.markNotificationAsRead(id)
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: { id } })
  }, [])

  // Set up listeners for state changes
  useEffect(() => {
    if (tasksData) {
      dispatch({ type: 'SET_TASKS', payload: tasksData })
    }
  }, [tasksData])

  useEffect(() => {
    if (listsData) {
      dispatch({ type: 'SET_LISTS', payload: listsData })
    }
  }, [listsData])

  useEffect(() => {
    if (labelsData) {
      dispatch({ type: 'SET_LABELS', payload: labelsData })
    }
  }, [labelsData])

  useEffect(() => {
    if (notificationsData) {
      dispatch({ type: 'SET_NOTIFICATIONS', payload: notificationsData })
    }
  }, [notificationsData])

  const contextValue: TaskContextType = {
    tasks: state.tasks,
    lists: state.lists,
    labels: state.labels,
    notifications: state.notifications,
    loading: state.loading || tasksLoading,
    error: state.error || tasksError?.message || null,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    createList,
    updateList,
    deleteList,
    createLabel,
    updateLabel,
    deleteLabel,
    createNotification,
    markNotificationAsRead,
  }

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  )
}

// Custom hook to use the task context
export function useTaskContext() {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider')
  }
  return context
}

// Re-export QueryClient for root layout
export { queryClient }

export default TaskProvider