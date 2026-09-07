"use client"

import { TaskProvider } from '@/src/contexts/TaskContext'
import { useTaskContext } from '@/src/hooks/useTasks'
import DashboardContent from '@/components/dashboard/DashboardContent'
import { ErrorBoundary } from '@/src/components/ui/ErrorBoundary'
import { ToastContainer } from '@/src/hooks/useToast'

export default function Dashboard() {
  return (
    <TaskProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          <DashboardContent />
        </div>
        <ToastContainer />
      </ErrorBoundary>
    </TaskProvider>
  )
}