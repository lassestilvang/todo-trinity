import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { UserProvider } from '@/contexts/UserContext'
import { TaskProvider } from '@/contexts/TaskContext'

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
        <UserProvider>
          <TaskProvider>
            {children}
          </TaskProvider>
        </UserProvider>
      </body>
    </html>
  )
}