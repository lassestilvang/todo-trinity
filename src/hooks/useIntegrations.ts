"use client"

import { useState, useCallback, useEffect } from 'react'
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
  triggerZapierWebhook: (trigger: string, webhookData: any) => Promise<void>
}

export function useIntegrations(): UseIntegrationsResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [integrations, setIntegrations] = useState<Integration[]>([])

  // Fetch connected integrations
  const { data: fetchedIntegrations, isPending: fetchLoading, error: fetchError } = useQuery<Integration[]>(
    {
      queryKey: ['integrations'],
      queryFn: async () => {
        const response = await fetch('/api/integrations', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch integrations')
        }

        return response.json()
      }
    }
  )

  useEffect(() => {
    if (fetchedIntegrations) {
      setIntegrations(fetchedIntegrations)
      setError(null)
    }
  }, [fetchedIntegrations])

  useEffect(() => {
    if (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Failed to fetch integrations'
      setError(errorMessage)
      setIntegrations([])
    }
  }, [fetchError])

  // Mutation for connecting integrations
  const connectMutation = useMutation({
    mutationFn: async ({ provider, credentials }: { provider: string; credentials: Record<string, any> }) => {
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
    onSuccess: () => {
      setLoading(false)
    },
    onError: (err: Error) => {
      setError(err.message)
      setLoading(false)
    }
  })

  // Mutation for triggering Zapier webhook
  const zapierMutation = useMutation({
    mutationFn: async (data: { trigger: string; webhookData: any }) => {
      const response = await fetch('/api/integrations/zapier/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to trigger Zapier webhook')
      }

      return response.json()
    },
    onSuccess: () => {
      setLoading(false)
    },
    onError: (err: Error) => {
      setError(err.message)
      setLoading(false)
    }
  })

  // Mutation for disconnecting integrations
  const disconnectMutation = useMutation({
    mutationFn: async (provider: string) => {
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
    onSuccess: () => {
      setLoading(false)
    },
    onError: (err: Error) => {
      setError(err.message)
      setLoading(false)
    }
  })

  // Mutation for syncing integrations
  const syncMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await fetch(`/api/integrations/${provider}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to sync integration')
      }

      return response.json()
    },
    onSuccess: () => {
      setLoading(false)
    },
    onError: (err: Error) => {
      setError(err.message)
      setLoading(false)
    }
  })

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

  const triggerZapierWebhook = useCallback(
    async (trigger: string, webhookData: any) => {
      setLoading(true)
      setError(null)
      await zapierMutation.mutateAsync({ trigger, webhookData })
    },
    [zapierMutation]
  )

  return {
    integrations: Array.isArray(fetchedIntegrations) ? fetchedIntegrations : integrations,
    loading: fetchLoading || loading,
    error: typeof fetchError === 'string' ? fetchError : (fetchError?.message || error),
    connectIntegration,
    disconnectIntegration,
    syncIntegration,
    getAvailableIntegrations,
    triggerZapierWebhook
  }
}