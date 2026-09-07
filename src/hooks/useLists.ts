import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { List } from '@/src/types/index'
import { api } from '@/lib/api-client'
import { toast } from '@/src/hooks/useToast'

export function useLists() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery(
    ['lists'],
    () => api.getLists(),
    {
      select: (data: any) => data.lists || [],
      staleTime: 1000 * 60 * 5,
    }
  )

  const createList = useMutation(
    (listData: any) => api.createList(listData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['lists'])
        toast.success('List created successfully')
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to create list')
      },
    }
  )

  const updateList = useMutation(
    ({ id, updates }: { id: string; updates: Partial<List> }) => api.updateList(id, updates),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['lists'])
        toast.success('List updated successfully')
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to update list')
      },
    }
  )

  const deleteList = useMutation(
    (id: string) => api.deleteList(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['lists'])
        toast.success('List deleted successfully')
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to delete list')
      },
    }
  )

  return {
    lists: data || [],
    loading: isLoading,
    error: error?.message || null,
    createList: createList.mutate,
    updateList: updateList.mutate,
    deleteList: deleteList.mutate,
    isCreating: createList.isLoading,
    isUpdating: updateList.isLoading,
    isDeleting: deleteList.isLoading,
  }
}

export function useLabels() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery(
    ['labels'],
    () => api.getLabels(),
    {
      select: (data: any) => data.labels || [],
      staleTime: 1000 * 60 * 5,
    }
  )

  const createLabel = useMutation(
    (labelData: any) => api.createLabel(labelData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['labels'])
        toast.success('Label created successfully')
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to create label')
      },
    }
  )

  const updateLabel = useMutation(
    ({ id, updates }: { id: string; updates: Partial<List> }) => api.updateLabel(id, updates),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['labels'])
        toast.success('Label updated successfully')
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to update label')
      },
    }
  )

  const deleteLabel = useMutation(
    (id: string) => api.deleteLabel(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['labels'])
        toast.success('Label deleted successfully')
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to delete label')
      },
    }
  )

  return {
    labels: data || [],
    loading: isLoading,
    error: error?.message || null,
    createLabel: createLabel.mutate,
    updateLabel: updateLabel.mutate,
    deleteLabel: deleteLabel.mutate,
    isCreating: createLabel.isLoading,
    isUpdating: updateLabel.isLoading,
    isDeleting: deleteLabel.isLoading,
  }
}

export function useNotifications() {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery(
    ['notifications'],
    () => api.getNotifications(),
    {
      select: (data: any) => data.notifications || [],
      staleTime: 1000 * 60 * 5,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  )

  const createNotification = useMutation(
    (notificationData: any) => api.createNotification(notificationData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications'])
        toast.success('Notification created successfully')
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to create notification')
      },
    }
  )

  const markNotificationAsRead = useMutation(
    (id: string) => api.markNotificationAsRead(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications'])
        toast.success('Notification marked as read')
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to mark notification as read')
      },
    }
  )

  return {
    notifications: data || [],
    loading: isLoading,
    error: error?.message || null,
    createNotification: createNotification.mutate,
    markNotificationAsRead: markNotificationAsRead.mutate,
    isCreating: createNotification.isLoading,
    isMarkingAsRead: markNotificationAsRead.isLoading,
    refetch,
  }
}

export function useAuth() {
  const queryClient = useQueryClient()

  const { data: authData, isLoading, error } = useQuery(
    ['auth'],
    () => api.getAuth(),
    {
      staleTime: 1000 * 60 * 5,
    }
  )

  const login = useMutation(
    (credentials: { email: string; password: string }) => api.login(credentials),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['auth'])
        toast.success('Login successful')
      },
      onError: (error: any) => {
        toast.error(error.message || 'Login failed')
      },
    }
  )

  const signup = useMutation(
    (userData: any) => api.signup(userData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['auth'])
        toast.success('Account created successfully')
      },
      onError: (error: any) => {
        toast.error(error.message || 'Signup failed')
      },
    }
  )

  const logout = useMutation(
    () => api.logout(),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['auth'])
        queryClient.invalidateQueries(['tasks'])
        toast.success('Logged out successfully')
      },
      onError: (error: any) => {
        toast.error(error.message || 'Logout failed')
      },
    }
  )

  return {
    user: authData?.user || null,
    loading: isLoading,
    error: error?.message || null,
    login: login.mutate,
    signup: signup.mutate,
    logout: logout.mutate,
    isLoggingIn: login.isLoading,
    isSigningUp: signup.isLoading,
    isLoggingOut: logout.isLoading,
  }
}