import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { List } from '@/src/types/index'
import { api } from '@/lib/api-client'
import { toast } from '@/src/hooks/useToast'

export function useLists() {
  const queryClient = useQueryClient()

  const { data, isPending, error } = useQuery({
    queryKey: ['lists'],
    queryFn: () => api.getLists(),
    select: (data: any) => data.lists || [],
    staleTime: 1000 * 60 * 5,
  })

  const createList = useMutation({
    mutationFn: (listData: any) => api.createList(listData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      toast.success('List created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create list')
    },
  })

  const updateList = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<List> }) => api.updateList(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      toast.success('List updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update list')
    },
  })

  const deleteList = useMutation({
    mutationFn: (id: string) => api.deleteList(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      toast.success('List deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete list')
    },
  })

  return {
    lists: data || [],
    loading: isPending,
    error: error?.message || null,
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

  const { data, isPending, error } = useQuery({
    queryKey: ['labels'],
    queryFn: () => api.getLabels(),
    select: (data: any) => data.labels || [],
    staleTime: 1000 * 60 * 5,
  })

  const createLabel = useMutation({
    mutationFn: (labelData: any) => api.createLabel(labelData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] })
      toast.success('Label created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create label')
    },
  })

  const updateLabel = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<List> }) => api.updateLabel(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] })
      toast.success('Label updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update label')
    },
  })

  const deleteLabel = useMutation({
    mutationFn: (id: string) => api.deleteLabel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] })
      toast.success('Label deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete label')
    },
  })

  return {
    labels: data || [],
    loading: isPending,
    error: error?.message || null,
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

  const { data, isPending, error } = useQuery({
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
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create notification')
    },
  })

  const markNotificationAsRead = useMutation({
    mutationFn: (id: string) => api.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mark notification as read')
    },
  })

  return {
    notifications: data || [],
    loading: isPending,
    error: error?.message || null,
    createNotification: createNotification.mutate,
    markNotificationAsRead: markNotificationAsRead.mutate,
    isCreating: createNotification.isPending,
    isMarkingAsRead: markNotificationAsRead.isPending,
  }
}

export function useAuth() {
  const queryClient = useQueryClient()

  const { data: authData, isPending, error } = useQuery({
    queryKey: ['auth'],
    queryFn: () => api.getAuth(),
    staleTime: 1000 * 60 * 5,
  })

  const login = useMutation({
    mutationFn: (credentials: { email: string; password: string }) => api.login(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Login failed')
    },
  })

  const signup = useMutation({
    mutationFn: (userData: any) => api.signup(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Signup failed')
    },
  })

  const logout = useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Logout failed')
    },
  })

  return {
    user: authData?.user || null,
    loading: isPending,
    error: error?.message || null,
    login: login.mutate,
    signup: signup.mutate,
    logout: logout.mutate,
    isLoggingIn: login.isPending,
    isSigningUp: signup.isPending,
    isLoggingOut: logout.isPending,
  }
}