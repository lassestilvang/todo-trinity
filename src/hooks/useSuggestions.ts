import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from '@/src/hooks/useToast'

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

export function useAnalytics(userId: string, params?: any) {
  const { data, isLoading, error } = useQuery(
    ['analytics', userId, params],
    () => api.getAnalytics(userId, params),
    {
      enabled: !!userId,
      staleTime: 1000 * 60 * 5,
    }
  )

  return {
    analytics: data || null,
    loading: isLoading,
    error: error?.message || null,
  }
}

export function useExport(params?: any) {
  const mutation = useMutation(
    (params: any) => api.exportData(params)
  )

  return {
    export: mutation.mutate,
    data: mutation.data || null,
    loading: mutation.isLoading,
    error: mutation.error?.message || null,
  }
}

export function useImport() {
  const mutation = useMutation(
    (file: File) => api.importData(file)
  )

  return {
    import: mutation.mutate,
    result: mutation.data || null,
    loading: mutation.isLoading,
    error: mutation.error?.message || null,
  }
}

export function useBackup() {
  const queryClient = useQueryClient()

  const createBackup = useMutation(
    (type: string) => api.createBackup(type),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['backups'])
        toast.success('Backup created successfully')
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to create backup')
      },
    }
  )

  const { data, isLoading, error } = useQuery(
    ['backups'],
    () => api.getBackups(),
    {
      staleTime: 1000 * 60 * 5,
    }
  )

  return {
    backups: data?.backups || [],
    loading: isLoading,
    error: error?.message || null,
    createBackup: createBackup.mutate,
    isCreating: createBackup.isLoading,
  }
}

export function useIntegrations() {
  const { data, isLoading, error } = useQuery(
    ['integrations'],
    () => api.getIntegrations()
  )

  return {
    integrations: data?.integrations || [],
    loading: isLoading,
    error: error?.message || null,
  }
}

export function useSettings() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery(
    ['settings'],
    () => api.getSettings()
  )

  const updateSettings = useMutation(
    (settings: any) => api.updateSettings(settings),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['settings'])
        toast.success('Settings updated successfully')
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to update settings')
      },
    }
  )

  return {
    settings: data?.settings || null,
    loading: isLoading,
    error: error?.message || null,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isLoading,
  }
}

export function useRealtimeEvents(userId: string) {
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    const eventSource = new EventSource(`/api/realtime?userId=${userId}`)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setEvents(prev => [...prev.slice(-49), data])
      } catch (e) {
        console.error('Error parsing realtime event:', e)
      }
    }

    eventSource.onerror = (error) => {
      console.error('Realtime connection error:', error)
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [userId])

  return { events }
}