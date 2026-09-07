import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Task, TaskStatus, Priority } from '@/src/types/index'
import { api } from '@/lib/api-client'
import { toast } from '@/src/hooks/useToast'

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

  const { data, isLoading, error, refetch } = useQuery(
    ['tasks', filters],
    () => api.getTasks(filters),
    {
      select: (data: any) => data.tasks || [],
      staleTime: 1000 * 60 * 5,
    }
  )

  const createTask = useMutation(
    (taskData: any) => api.createTask(taskData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks'])
        toast.success('Task created successfully')
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to create task')
      },
    }
  )

  const updateTask = useMutation(
    ({ id, updates }: { id: string; updates: Partial<Task> }) => api.updateTask(id, updates),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks'])
        toast.success('Task updated successfully')
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to update task')
      },
    }
  )

  const deleteTask = useMutation(
    (id: string) => api.deleteTask(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks'])
        toast.success('Task deleted successfully')
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to delete task')
      },
    }
  )

  return {
    tasks: data || [],
    loading: isLoading,
    error: error?.message || null,
    createTask: createTask.mutate,
    updateTask: updateTask.mutate,
    deleteTask: deleteTask.mutate,
    isCreating: createTask.isLoading,
    isUpdating: updateTask.isLoading,
    isDeleting: deleteTask.isLoading,
    refetch,
  }
}

export function useTask(id: string) {
  const { data, isLoading, error } = useQuery(
    ['task', id],
    () => api.getTask(id),
    {
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
    }
  )

  return {
    task: data?.task || null,
    loading: isLoading,
    error: error?.message || null,
  }
}

export function useTaskStats(userId: string) {
  const { data, isLoading, error } = useQuery(
    ['userStats', userId],
    () => api.getUserStats(userId),
    {
      enabled: !!userId,
      staleTime: 1000 * 60 * 5,
    }
  )

  return {
    stats: data || null,
    loading: isLoading,
    error: error?.message || null,
  }
}

export function useGamification(userId: string) {
  const { data, isLoading, error } = useQuery(
    ['gamification', userId],
    () => api.getGamification(userId),
    {
      enabled: !!userId,
      staleTime: 1000 * 60 * 5,
    }
  )

  return {
    gamification: data || null,
    loading: isLoading,
    error: error?.message || null,
  }
}

export function useSuggestions(userId: string) {
  const { data, isLoading, error } = useQuery(
    ['suggestions', userId],
    () => api.getSuggestions(userId),
    {
      enabled: !!userId,
      staleTime: 1000 * 60 * 5,
    }
  )

  return {
    suggestions: data?.suggestions || [],
    loading: isLoading,
    error: error?.message || null,
  }
}

export function useParseNaturalLanguage() {
  const mutation = useMutation(
    ({ text, userId }: { text: string; userId: string }) =>
      api.parseNaturalLanguage(text, userId)
  )

  return {
    parse: mutation.mutate,
    parsed: mutation.data?.parsed || null,
    loading: mutation.isLoading,
    error: mutation.error?.message || null,
  }
}

export function useSearch(query: string) {
  const { data, isLoading, error } = useQuery(
    ['search', query],
    () => api.getSearch(query),
    {
      enabled: query.length > 0,
      staleTime: 1000 * 60 * 5,
    }
  )

  return {
    results: data?.results || { tasks: [], lists: [], labels: [] },
    loading: isLoading,
    error: error?.message || null,
  }
}

export function useViews(viewType: string) {
  const { data, isLoading, error } = useQuery(
    ['views', viewType],
    () => api.getViews(viewType),
    {
      enabled: !!viewType,
      staleTime: 1000 * 60 * 5,
    }
  )

  return {
    views: data || [],
    loading: isLoading,
    error: error?.message || null,
  }
}