import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { List } from '@/src/types/index'
import { api } from '@/lib/api-client'
import { useToast } from '@/src/hooks/useToast'

export function useLists() {
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const { data, isPending, error: queryError } = useQuery({
    queryKey: ['lists'],
    queryFn: () => api.getLists(),
    select: (data: any) => data.lists || [],
    staleTime: 1000 * 60 * 5,
  })

  const createList = useMutation({
    mutationFn: (listData: any) => api.createList(listData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      success('List created successfully')
    },
    onError: (err: any) => {
      error(err.message || 'Failed to create list')
    },
  })

  const updateList = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<List> }) => api.updateList(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      success('List updated successfully')
    },
    onError: (err: any) => {
      error(err.message || 'Failed to update list')
    },
  })

  const deleteList = useMutation({
    mutationFn: (id: string) => api.deleteList(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      success('List deleted successfully')
    },
    onError: (err: any) => {
      error(err.message || 'Failed to delete list')
    },
  })

  return {
    lists: data || [],
    loading: isPending,
    error: queryError?.message || null,
    createList: createList.mutate,
    updateList: updateList.mutate,
    deleteList: deleteList.mutate,
    isCreating: createList.isPending,
    isUpdating: updateList.isPending,
    isDeleting: deleteList.isPending,
  }
}

export function useLabels() {
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const { data, isPending, error: queryError } = useQuery({
    queryKey: ['labels'],
    queryFn: () => api.getLabels(),
    select: (data: any) => data.labels || [],
    staleTime: 1000 * 60 * 5,
  })

  const createLabel = useMutation({
    mutationFn: (labelData: any) => api.createLabel(labelData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] })
      success('Label created successfully')
    },
    onError: (err: any) => {
      error(err.message || 'Failed to create label')
    },
  })

  const updateLabel = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<List> }) => api.updateLabel(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] })
      success('Label updated successfully')
    },
    onError: (err: any) => {
      error(err.message || 'Failed to update label')
    },
  })

  const deleteLabel = useMutation({
    mutationFn: (id: string) => api.deleteLabel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] })
      success('Label deleted successfully')
    },
    onError: (err: any) => {
      error(err.message || 'Failed to delete label')
    },
  })

  return {
    labels: data || [],
    loading: isPending,
    error: queryError?.message || null,
    createLabel: createLabel.mutate,
    updateLabel: updateLabel.mutate,
    deleteLabel: deleteLabel.mutate,
    isCreating: createLabel.isPending,
    isUpdating: updateLabel.isPending,
    isDeleting: deleteLabel.isPending,
  }
}

export function useNotifications() {
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const { data, isPending, error: queryError } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
    select: (data: any) => data.notifications || [],
    staleTime: 1000 * 60 * 5,
    refetchInterval: 30000,
  })

  const createNotification = useMutation({
    mutationFn: (notificationData: any) => api.createNotification(notificationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (err: any) => {
      error(err.message || 'Failed to create notification')
    },
  })

  const markNotificationAsRead = useMutation({
    mutationFn: (id: string) => api.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (err: any) => {
      error(err.message || 'Failed to mark notification as read')
    },
  })

  return {
    notifications: data || [],
    loading: isPending,
    error: queryError?.message || null,
    createNotification: createNotification.mutate,
    markNotificationAsRead: markNotificationAsRead.mutate,
    isCreating: createNotification.isPending,
    isMarkingAsRead: markNotificationAsRead.isPending,
  }
}

export function useAuth() {
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const { data: authData, isPending, error: queryError } = useQuery({
    queryKey: ['auth'],
    queryFn: () => api.getAuth(),
    staleTime: 1000 * 60 * 5,
  })

  const login = useMutation({
    mutationFn: (credentials: { email: string; password: string }) => api.login(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
    onError: (err: any) => {
      error(err.message || 'Login failed')
    },
  })

  const signup = useMutation({
    mutationFn: (userData: any) => api.signup(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
    onError: (err: any) => {
      error(err.message || 'Signup failed')
    },
  })

  const logout = useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (err: any) => {
      error(err.message || 'Logout failed')
    },
  })

  return {
    user: authData?.user || null,
    loading: isPending,
    error: queryError?.message || null,
    login: login.mutate,
    signup: signup.mutate,
    logout: logout.mutate,
    isLoggingIn: login.isPending,
    isSigningUp: signup.isPending,
    isLoggingOut: logout.isPending,
  }
}