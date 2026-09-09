"use client"

import { createContext, useContext, ReactNode, useReducer, useEffect, useCallback } from 'react'

// Types
interface Workspace {
  id: string
  name: string
  description: string
  color: string
  icon: string
  ownerId: string
  memberCount: number
  taskCount: number
  createdAt: string
  updatedAt: string
}

interface WorkspaceMember {
  id: string
  workspaceId: string
  userId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  joinedAt: string
}

interface WorkspaceInvitation {
  id: string
  workspaceId: string
  email: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  token: string
  expiresAt: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
}

interface WorkspaceState {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  loading: boolean
  error: string | null
  members: WorkspaceMember[]
  invitations: WorkspaceInvitation[]
}

interface WorkspaceContextType {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  loading: boolean
  error: string | null
  fetchWorkspaces: () => Promise<void>
  createWorkspace: (workspaceData: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<void>
  deleteWorkspace: (id: string) => Promise<void>
  switchWorkspace: (workspaceId: string) => Promise<void>
  getWorkspaceMembers: (workspaceId: string) => Promise<void>
  inviteToWorkspace: (workspaceId: string, email: string, role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER') => Promise<void>
  removeFromWorkspace: (workspaceId: string, memberId: string) => Promise<void>
}

// Initial state
const initialState: WorkspaceState = {
  workspaces: [],
  currentWorkspace: null,
  loading: false,
  error: null,
  members: [],
  invitations: []
}

// Reducer
function workspaceReducer(state: WorkspaceState, action: any): WorkspaceState {
  switch (action.type) {
    case 'SET_WORKSPACES':
      return { ...state, workspaces: action.payload, loading: false, error: null }
    case 'SET_CURRENT_WORKSPACE':
      return { ...state, currentWorkspace: action.payload, loading: false, error: null }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    case 'ADD_WORKSPACE':
      return { ...state, workspaces: [action.payload, ...state.workspaces] }
    case 'UPDATE_WORKSPACE':
      return {
        ...state,
        workspaces: state.workspaces.map(workspace =>
          workspace.id === action.payload.id ? action.payload : workspace
        ),
      }
    case 'DELETE_WORKSPACE':
      return {
        ...state,
        workspaces: state.workspaces.filter(workspace => workspace.id !== action.payload),
      }
    case 'SET_MEMBERS':
      return { ...state, members: action.payload }
    case 'ADD_MEMBER':
      return { ...state, members: [action.payload, ...state.members] }
    case 'REMOVE_MEMBER':
      return {
        ...state,
        members: state.members.filter(member => member.id !== action.payload),
      }
    case 'SET_INVITATIONS':
      return { ...state, invitations: action.payload }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

// Context
const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

// Provider
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workspaceReducer, initialState)

  // API helper functions
  const api = {
    getWorkspaces: async (): Promise<Workspace[]> => {
      const response = await fetch('/api/workspaces')
      if (!response.ok) {
        throw new Error('Failed to fetch workspaces')
      }
      return response.json()
    },

    createWorkspace: async (workspaceData: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workspace> => {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workspaceData),
      })
      if (!response.ok) {
        throw new Error('Failed to create workspace')
      }
      return response.json()
    },

    updateWorkspace: async (id: string, updates: Partial<Workspace>): Promise<Workspace> => {
      const response = await fetch(`/api/workspaces/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        throw new Error('Failed to update workspace')
      }
      return response.json()
    },

    deleteWorkspace: async (id: string): Promise<void> => {
      const response = await fetch(`/api/workspaces/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete workspace')
      }
      return response.json()
    },

    getWorkspaceMembers: async (workspaceId: string): Promise<WorkspaceMember[]> => {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`)
      if (!response.ok) {
        throw new Error('Failed to fetch workspace members')
      }
      return response.json()
    },

    inviteToWorkspace: async (workspaceId: string, email: string, role: string): Promise<WorkspaceInvitation> => {
      const response = await fetch(`/api/workspaces/${workspaceId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })
      if (!response.ok) {
        throw new Error('Failed to invite to workspace')
      }
      return response.json()
    },

    removeFromWorkspace: async (workspaceId: string, memberId: string): Promise<void> => {
      const response = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to remove from workspace')
      }
      return response.json()
    }
  }

  // Action creators
  const fetchWorkspaces = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const workspaces = await api.getWorkspaces()
      dispatch({ type: 'SET_WORKSPACES', payload: workspaces })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
    }
  }, [])

  const createWorkspace = useCallback(
    async (workspaceData: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const workspace = await api.createWorkspace(workspaceData)
        dispatch({ type: 'ADD_WORKSPACE', payload: workspace })
        // Set as current workspace if none exists
        if (!state.currentWorkspace) {
          dispatch({ type: 'SET_CURRENT_WORKSPACE', payload: workspace })
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
      }
    },
    [state.currentWorkspace]
  )

  const updateWorkspace = useCallback(
    async (id: string, updates: Partial<Workspace>) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const workspace = await api.updateWorkspace(id, updates)
        dispatch({ type: 'UPDATE_WORKSPACE', payload: workspace })
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
      }
    },
    []
  )

  const deleteWorkspace = useCallback(
    async (id: string) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        await api.deleteWorkspace(id)
        dispatch({ type: 'DELETE_WORKSPACE', payload: id })
        // If deleting current workspace, switch to another or null
        if (state.currentWorkspace?.id === id) {
          const remainingWorkspaces = state.workspaces.filter(w => w.id !== id)
          dispatch({ type: 'SET_CURRENT_WORKSPACE', payload: remainingWorkspaces[0] || null })
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
      }
    },
    [state.currentWorkspace, state.workspaces]
  )

  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const workspace = state.workspaces.find(w => w.id === workspaceId)
        if (!workspace) {
          throw new Error('Workspace not found')
        }
        dispatch({ type: 'SET_CURRENT_WORKSPACE', payload: workspace })
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
      }
    },
    [state.workspaces]
  )

  const getWorkspaceMembers = useCallback(
    async (workspaceId: string) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const members = await api.getWorkspaceMembers(workspaceId)
        dispatch({ type: 'SET_MEMBERS', payload: members })
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
      }
    },
    []
  )

  const inviteToWorkspace = useCallback(
    async (workspaceId: string, email: string, role: string) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const invitation = await api.inviteToWorkspace(workspaceId, email, role)
        dispatch({ type: 'SET_INVITATIONS', payload: [...state.invitations, invitation] })
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
      }
    },
    [state.invitations]
  )

  const removeFromWorkspace = useCallback(
    async (workspaceId: string, memberId: string) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        await api.removeFromWorkspace(workspaceId, memberId)
        dispatch({ type: 'REMOVE_MEMBER', payload: memberId })
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
      }
    },
    []
  )

  // Effects
  useEffect(() => {
    fetchWorkspaces()
  }, [])

  const contextValue: WorkspaceContextType = {
    workspaces: state.workspaces,
    currentWorkspace: state.currentWorkspace,
    loading: state.loading,
    error: state.error,
    fetchWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    switchWorkspace,
    getWorkspaceMembers,
    inviteToWorkspace,
    removeFromWorkspace
  }

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  )
}

// Hook
export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspaceContext must be used within a WorkspaceProvider')
  }
  return context
}