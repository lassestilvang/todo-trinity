import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/src/contexts/TaskContext'
import { TaskProvider } from '@/src/contexts/TaskContext'
import { UserProvider } from '@/src/contexts/UserContext'
import { ErrorBoundary } from '@/src/components/ui/ErrorBoundary'
import { ToastContainer } from '@/src/hooks/useToast'
import { PWARegister } from '@/src/components/pwa/PWARegister'
import { VoiceInput } from '@/src/components/voice/VoiceInput'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Todo Trinity - Modern Task Management',
  description: 'A modern, feature-rich task management application built with Next.js, TypeScript, and Prisma',
  metadataBase: new URL('https://todotrinity.com'),
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }
    ]
  },
  appleWebApp: {
    capable: true,
    title: 'Todo Trinity',
    statusBarStyle: 'default',
    startupImage: '/icons/icon-512x512.png'
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'theme-color': '#3b82f6',
    'background-color': '#ffffff',
    'apple-mobile-web-app-title': 'Todo Trinity'
  },
  openGraph: {
    title: 'Todo Trinity',
    description: 'Modern task management with AI-powered features, real-time collaboration, and advanced analytics.',
    url: 'https://todotrinity.com',
    siteName: 'Todo Trinity',
    images: [
      {
        url: '/icons/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'Todo Trinity Logo'
      }
    ],
    type: 'website'
  },
  twitter: {
    card: 'summary',
    title: 'Todo Trinity',
    description: 'Modern task management with AI-powered features, real-time collaboration, and advanced analytics.',
    images: ['/icons/icon-512x512.png']
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="background-color" content="#ffffff" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      </head>
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <UserProvider>
            <TaskProvider>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
              <ToastContainer />
              <PWARegister />
              <VoiceInput />
            </TaskProvider>
          </UserProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}