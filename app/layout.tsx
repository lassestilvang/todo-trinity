import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/src/contexts/TaskContext'
import { TaskProvider } from '@/src/contexts/TaskContext'
import { UserProvider } from '@/src/contexts/UserContext'
import { ErrorBoundary } from '@/src/components/ui/ErrorBoundary'
import { ToastContainer } from '@/src/hooks/useToast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Todo Trinity - Modern Task Management',
  description: 'A modern, feature-rich task management application built with Next.js, TypeScript, and Prisma',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <UserProvider>
            <TaskProvider>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
              <ToastContainer />
            </TaskProvider>
          </UserProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}