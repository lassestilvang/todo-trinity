"use client"

import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Integration, IntegrationConfig, integrationConfigs } from '@/lib/integrations/base'

interface UseIntegrationsResult {
  integrations: Integration[]
  loading: boolean
  error: string | null
  connectIntegration: (provider: string, credentials: Record<string, any>) => Promise<void>
  disconnectIntegration: (provider: string) => Promise<void>
  syncIntegration: (provider: string) => Promise<void>
  getAvailableIntegrations: () => IntegrationConfig[]
}

export function useIntegrations(): UseIntegrationsResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [integrations, setIntegrations] = useState<Integration[]>([])

  // Fetch connected integrations
  const { data: fetchedIntegrations, isLoading: fetchLoading, error: fetchError } = useQuery<
    Integration[],
    Error
  >(['integrations'], async () => {
    const response = await fetch('/api/integrations', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch integrations')
    }

    return response.json()
  }, {
    onSuccess: (data) => {
      setIntegrations(data)
      setError(null)
    },
    onError: (err) => {
      setError(err.message)
      setIntegrations([])
    }
  })

  // Mutation for connecting integrations
  const connectMutation = useMutation(
    async ({ provider, credentials }: { provider: string; credentials: Record<string, any> }) => {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, credentials })
      })

      if (!response.ok) {
        throw new Error('Failed to connect integration')
      }

      return response.json()
    },
    {
      onSuccess: () => {
        // Refetch integrations on success
        setLoading(false)
      },
      onError: (err) => {
        setError(err.message)
        setLoading(false)
      }
    }
  )

  // Mutation for disconnecting integrations
  const disconnectMutation = useMutation(
    async (provider: string) => {
      const response = await fetch('/api/integrations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect integration')
      }

      return response.json()
    },
    {
      onSuccess: () => {
        // Refetch integrations on success
        setLoading(false)
      },
      onError: (err) => {
        setError(err.message)
        setLoading(false)
      }
    }
  )

  // Mutation for syncing integrations
  const syncMutation = useMutation(
    async (provider: string) => {
      const response = await fetch(`/api/integrations/${provider}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to sync integration')
      }

      return response.json()
    },
    {
      onSuccess: () => {
        // Refetch integrations on success
        setLoading(false)
      },
      onError: (err) => {
        setError(err.message)
        setLoading(false)
      }
    }
  )

  const connectIntegration = useCallback(
    async (provider: string, credentials: Record<string, any>) => {
      setLoading(true)
      setError(null)
      await connectMutation.mutateAsync({ provider, credentials })
    },
    [connectMutation]
  )

  const disconnectIntegration = useCallback(
    async (provider: string) => {
      setLoading(true)
      setError(null)
      await disconnectMutation.mutateAsync(provider)
    },
    [disconnectMutation]
  )

  const syncIntegration = useCallback(
    async (provider: string) => {
      setLoading(true)
      setError(null)
      await syncMutation.mutateAsync(provider)
    },
    [syncMutation]
  )

  const getAvailableIntegrations = useCallback(() => {
    return integrationConfigs
  }, [])

  return {
    integrations: fetchedIntegrations || integrations,
    loading: fetchLoading || loading,
    error: fetchError || error,
    connectIntegration,
    disconnectIntegration,
    syncIntegration,
    getAvailableIntegrations
  }
}