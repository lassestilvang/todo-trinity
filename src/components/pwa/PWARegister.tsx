"use client"

import { useEffect, useState, useCallback } from 'react'
import { useToast } from '@/src/hooks/useToast'

export default function PWARegister() {
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const { addToast } = useToast()

  // Define all callbacks before using them in useEffect
  const registerServiceWorker = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      setSwRegistration(registration)

      // Check for updates periodically
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true)
              addToast('New version available! Click to refresh', 'info', 0)
            }
          })
        }
      })

      console.log('Service Worker registered:', registration.scope)
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }, [addToast])

  const checkForUpdates = useCallback(async () => {
    if (swRegistration) {
      try {
        await swRegistration.update()
      } catch (error) {
        console.error('Failed to check for updates:', error)
      }
    }
  }, [swRegistration])

  // Check for updates periodically
  useEffect(() => {
    const interval = setInterval(() => {
      checkForUpdates()
    }, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [checkForUpdates])

  const setupPeriodicSync = useCallback(async () => {
    if (swRegistration && 'periodicSync' in swRegistration) {
      try {
        // @ts-ignore - Periodic Background Sync API types may not be fully typed
        await (swRegistration.periodicSync as any).register('check-reminders', {
          minInterval: 60 * 60 * 1000 // 1 hour
        })
      } catch (error) {
        console.log('Periodic sync not available:', error)
      }
    }
  }, [swRegistration])

  const setupPushNotifications = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      // We'll request permission when the user explicitly asks
      console.log('Push notifications available, waiting for user permission')
    }
  }, [])

  // useEffect must come after all callbacks are defined
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Use queueMicrotask to avoid direct setState in effect
      queueMicrotask(() => registerServiceWorker())
    }
  }, [registerServiceWorker])

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        addToast('Notifications enabled', 'success')

        if (swRegistration) {
          try {
            const subscription = await swRegistration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(
                process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
              )
            })

            // Send subscription to server
            await fetch('/api/notifications/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(subscription)
            })
          } catch (error) {
            console.error('Push subscription failed:', error)
          }
        }
      } else {
        addToast('Notifications blocked', 'warning')
      }
    }
  }, [swRegistration, addToast])

  const installPWA = useCallback(async () => {
    if (typeof window !== 'undefined' && 'beforeinstallprompt' in window) {
      // This would be triggered by the beforeinstallprompt event
      addToast('PWA install prompt available', 'info')
    }
  }, [addToast])

  const handleInstall = useCallback(() => {
    // Triggered from beforeinstallprompt event
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault()
        // Store for later use
      })
    }
  }, [])

  return null // This component doesn't render anything visible
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = typeof window !== 'undefined' ? window.atob(base64) : Buffer.from(base64, 'base64').toString('binary')
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Share Target API handler
export async function handleShareTarget() {
  if ('shareTarget' in navigator) {
    // This would be handled in the share target page
  }
}