"use client"

import { TaskProvider } from '@/src/contexts/TaskContext'
import { WorkspaceProvider } from '@/src/contexts/WorkspaceContext'
import { useTaskContext } from '@/src/contexts'
import DashboardContent from '@/components/dashboard/DashboardContent'
import { ErrorBoundary } from '@/src/components/ui/ErrorBoundary'
import { ToastContainer } from '@/src/hooks/useToast'

export default function Dashboard() {
  return (
    <TaskProvider>
      <WorkspaceProvider>
        <ErrorBoundary>
          <div className="min-h-screen bg-gray-50">
            <DashboardContent />
          </div>
          <ToastContainer />
        </ErrorBoundary>
      </WorkspaceProvider>
    </TaskProvider>
  )
}