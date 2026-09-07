import { useState, useCallback, useEffect } from 'react'
import { create } from 'zustand'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface ToastState {
  toasts: Toast[]
  addToast: (message: string, type: Toast['type'], duration?: number) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (message, type, duration = 5000) => {
    const id = Math.random().toString(36).slice(2)
    const toast: Toast = { id, message, type, duration }
    set(state => ({ toasts: [...state.toasts, toast] }))

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, duration)
    }
  },
  removeToast: (id) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
  },
  clearToasts: () => {
    set({ toasts: [] })
  },
}))

// Convenience hook
export function useToast() {
  const { addToast, removeToast, clearToasts, toasts } = useToastStore()

  const toast = useCallback(
    (message: string, type: Toast['type'] = 'info', duration?: number) => {
      addToast(message, type, duration)
    },
    [addToast]
  )

  const success = useCallback(
    (message: string, duration?: number) => {
      addToast(message, 'success', duration)
    },
    [addToast]
  )

  const error = useCallback(
    (message: string, duration?: number) => {
      addToast(message, 'error', duration)
    },
    [addToast]
  )

  const warning = useCallback(
    (message: string, duration?: number) => {
      addToast(message, 'warning', duration)
    },
    [addToast]
  )

  const info = useCallback(
    (message: string, duration?: number) => {
      addToast(message, 'info', duration)
    },
    [addToast]
  )

  return {
    toast,
    success,
    error,
    warning,
    info,
    removeToast,
    clearToasts,
    toasts,
  }
}

// Toast container component
export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '24rem',
      }}
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const interval = setInterval(() => {
        setProgress(prev => Math.max(0, prev - 100 / (toast.duration! / 100)))
      }, 100)

      const timer = setTimeout(() => {
        onClose(toast.id)
      }, toast.duration)

      return () => {
        clearInterval(interval)
        clearTimeout(timer)
      }
    }
  }, [toast.duration, toast.id, onClose])

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: '✓',
          iconBg: 'bg-green-500',
        }
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: '✕',
          iconBg: 'bg-red-500',
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: '!',
          iconBg: 'bg-yellow-500',
        }
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'i',
          iconBg: 'bg-blue-500',
        }
    }
  }

  const styles = getToastStyles()

  return (
    <div
      className={`
        ${styles.bg} ${styles.border} ${styles.text}
        border rounded-lg shadow-lg p-4 min-w-[200px]
        animate-in slide-in-from-right duration-300
      `}
    >
      <div className="flex items-start">
        <div className={`
          ${styles.iconBg} text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0
        `}>
          {styles.icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
        <button
          onClick={() => onClose(toast.id)}
          className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gray-400 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export default ToastContainer