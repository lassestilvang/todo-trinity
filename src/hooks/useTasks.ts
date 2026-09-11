import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Task, TaskStatus, Priority, SubTask } from '@/src/types/index'
import { api } from '@/lib/api-client'
import { toast } from '@/src/hooks/useToast'
import { useState, useCallback, useEffect } from 'react'

export function useTasks(filters?: {
  listId?: string
  status?: TaskStatus
  priority?: Priority
  search?: string
  labelId?: string
  page?: number
  limit?: number
}) {
  const queryClient = useQueryClient()

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['tasks', filters ?? {}],
    queryFn: () => api.getTasks(filters),
    select: (data: any) => data.tasks || [],
    staleTime: 1000 * 60 * 5,
  })

  const createTask = useMutation({
    mutationFn: (taskData: any) => api.createTask(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create task')
    },
  })

  const updateTask = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) => api.updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update task')
    },
  })

  const deleteTask = useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete task')
    },
  })

  return {
    tasks: data || [],
    loading: isPending,
    error: error?.message || null,
    createTask: createTask.mutate,
    updateTask: updateTask.mutate,
    deleteTask: deleteTask.mutate,
    isCreating: createTask.isPending,
    isUpdating: updateTask.isPending,
    isDeleting: deleteTask.isPending,
    refetch,
  }
}

export function useTask(id: string) {
  const { data, isPending, error } = useQuery({
    queryKey: ['task', id],
    queryFn: () => api.getTask(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })

  return {
    task: data?.task || null,
    loading: isPending,
    error: error?.message || null,
  }
}

export function useTaskStats(userId: string) {
  const { data, isPending, error } = useQuery({
    queryKey: ['userStats', userId],
    queryFn: () => api.getUserStats(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })

  return {
    stats: data || null,
    loading: isPending,
    error: error?.message || null,
  }
}

export function useGamification(userId: string) {
  const { data, isPending, error } = useQuery({
    queryKey: ['gamification', userId],
    queryFn: () => api.getGamification(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })

  return {
    gamification: data || null,
    loading: isPending,
    error: error?.message || null,
  }
}

export function useSuggestions(userId: string) {
  const { data, isPending, error } = useQuery({
    queryKey: ['suggestions', userId],
    queryFn: () => api.getSuggestions(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })

  return {
    suggestions: data?.suggestions || [],
    loading: isPending,
    error: error?.message || null,
  }
}

export function useParseNaturalLanguage() {
  const mutation = useMutation({
    mutationFn: ({ text, userId }: { text: string; userId: string }) =>
      api.parseNaturalLanguage(text, userId),
  })

  return {
    parse: mutation.mutate,
    parsed: mutation.data?.parsed || null,
    loading: mutation.isPending,
    error: mutation.error?.message || null,
  }
}

export function useSearch(query: string) {
  const { data, isPending, error } = useQuery({
    queryKey: ['search', query],
    queryFn: () => api.getSearch(query),
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 5,
  })

  const { data: listsData } = useQuery({
    queryKey: ['lists'],
    queryFn: () => api.getLists(),
    staleTime: 1000 * 60 * 5,
  })

  return {
    results: data?.results || { tasks: [], lists: listsData?.lists || [], labels: [] },
    loading: isPending,
    error: error?.message || null,
  }
}

export function useSavedSearches() {
  const queryClient = useQueryClient()

  const { data, isPending, error } = useQuery({
    queryKey: ['savedSearches'],
    queryFn: () => api.getSavedSearches(),
    staleTime: 1000 * 60 * 5,
  })

  const saveSearch = useMutation({
    mutationFn: (searchData: { name: string; filters?: any; query?: string }) =>
      api.saveSearch(searchData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save search')
    },
  })

  const deleteSearch = useMutation({
    mutationFn: (name: string) => api.deleteSearch(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete saved search')
    },
  })

  return {
    searches: data?.searches || [],
    loading: isPending,
    error: error?.message || null,
    saveSearch: saveSearch.mutate,
    deleteSearch: deleteSearch.mutate,
    isSaving: saveSearch.isPending,
    isDeleting: deleteSearch.isPending,
  }
}

export function useViews(viewType: string) {
  const { data, isPending, error } = useQuery({
    queryKey: ['views', viewType],
    queryFn: () => api.getViews(viewType),
    enabled: !!viewType,
    staleTime: 1000 * 60 * 5,
  })

  return {
    views: data || [],
    loading: isPending,
    error: error?.message || null,
  }
}

export function useSubTasks(taskId: string) {
  const queryClient = useQueryClient()

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['subtasks', taskId],
    queryFn: () => api.getSubTasks(taskId),
    enabled: !!taskId,
    staleTime: 1000 * 60 * 5,
  })

  const createSubTask = useMutation({
    mutationFn: (subTaskData: { title: string; taskId: string }) =>
      api.createSubTask(subTaskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create subtask')
    },
  })

  const updateSubTask = useMutation({
    mutationFn: ({ taskId, subTaskId, updates }: { taskId: string; subTaskId: string; updates: Partial<SubTask> }) =>
      api.updateSubTask(taskId, subTaskId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update subtask')
    },
  })

  const deleteSubTask = useMutation({
    mutationFn: ({ taskId, subTaskId }: { taskId: string; subTaskId: string }) =>
      api.deleteSubTask(taskId, subTaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete subtask')
    },
  })

  return {
    subtasks: data?.subtasks || [],
    loading: isPending,
    error: error?.message || null,
    createSubTask: createSubTask.mutate,
    updateSubTask: updateSubTask.mutate,
    deleteSubTask: deleteSubTask.mutate,
    isCreating: createSubTask.isPending,
    isUpdating: updateSubTask.isPending,
    isDeleting: deleteSubTask.isPending,
    refetch,
  }
}

export function useTaskDependencies(taskId: string) {
  const queryClient = useQueryClient()

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['dependencies', taskId],
    queryFn: () => api.getTaskDependencies(taskId),
    enabled: !!taskId,
    staleTime: 1000 * 60 * 5,
  })

  const createDependency = useMutation({
    mutationFn: (dependencyData: { taskId: string; dependsOnId: string }) =>
      api.createTaskDependency(dependencyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependencies', taskId] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create dependency')
    },
  })

  const deleteDependency = useMutation({
    mutationFn: ({ taskId, dependsOnId }: { taskId: string; dependsOnId: string }) =>
      api.deleteTaskDependency(taskId, dependsOnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependencies', taskId] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete dependency')
    },
  })

  return {
    dependencies: data?.dependencies || [],
    loading: isPending,
    error: error?.message || null,
    createDependency: createDependency.mutate,
    deleteDependency: deleteDependency.mutate,
    isCreating: createDependency.isPending,
    isDeleting: deleteDependency.isPending,
    refetch,
  }
}

export function useSettings() {
  const queryClient = useQueryClient()

  const { data, isPending, error } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
    staleTime: 1000 * 60 * 5,
  })

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: any) => api.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update settings')
    },
  })

  // Default settings
  const defaultSettings = {
    theme: 'system',
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    notifications: true,
    emailNotifications: true,
    desktopNotifications: true,
    soundNotifications: false,
    autoSave: true,
    showCompleted: true,
    compactMode: false,
    weekStartsOn: '0',
    defaultTaskView: 'list',
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
    dailyGoal: 5,
    reminderTime: '09:00',
    reminderEnabled: true,
    keyboardShortcuts: true,
    animationsEnabled: true,
    calendarSync: {
      google: false,
      microsoft: false,
    },
    integrations: {
      slack: true,
      github: false,
    },
  }

  const settings = { ...defaultSettings, ...(data?.settings || {}) }

  return {
    settings,
    loading: isPending,
    error: error?.message || null,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
  }
}

export function useMentions() {
  const queryClient = useQueryClient()
  const [mentions, setMentions] = useState([])

  const fetchMentions = useCallback(async () => {
    try {
      const data = await api.getMentions()
      setMentions(data.mentions || [])
      return data
    } catch (error) {
      throw new Error('Failed to fetch mentions')
    }
  }, [])

  const markAsRead = useCallback(async () => {
    try {
      await api.markMentionsAsRead()
      setMentions([])
    } catch (error) {
      throw new Error('Failed to mark mentions as read')
    }
  }, [])

  useEffect(() => {
    fetchMentions()
  }, [fetchMentions])

  return {
    mentions,
    unreadCount: mentions.filter((m: any) => !m.read).length,
    fetchMentions,
    markAsRead,
  }
}