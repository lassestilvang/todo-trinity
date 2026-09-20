"use client"

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Calendar,
  Kanban,
  GanttChartSquare,
  BarChart2,
  Settings,
  Mic,
  Search,
  Plus,
  MoreHorizontal,
  X,
  Zap,
  Target,
  Brain,
  Users,
  Clock,
  Trophy,
  Bell,
  MessageSquare
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface MobileBottomNavProps {
  isOpen?: boolean
  onClose?: () => void
  notificationsCount?: number
  currentWorkspaceId?: string
  onSecondaryAction?: (id: string) => void
}

const primaryNavItems = [
  { href: '/', label: 'Today', icon: Home },
  { href: '/views/calendar', label: 'Calendar', icon: Calendar },
  { href: '/views/kanban', label: 'Kanban', icon: Kanban },
  { href: '/analytics', label: 'Insights', icon: BarChart2 },
]

const secondaryNavItems = [
  { id: 'gantt', label: 'Gantt', icon: GanttChartSquare },
  { id: 'suggestions', label: 'AI Suggestions', icon: Brain },
  { id: 'gamification', label: 'Gamification', icon: Trophy },
  { id: 'focus', label: 'Focus Mode', icon: Target },
  { id: 'collaboration', label: 'Collaborate', icon: Users },
  { id: 'automation', label: 'Automation', icon: Zap },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'notifications', label: 'Notifications', icon: Bell, badge: 0 },
  { id: 'mentions', label: 'Mentions', icon: MessageSquare, badge: 0 },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function MobileBottomNav({
  isOpen = true,
  onClose,
  notificationsCount = 0,
  onSecondaryAction,
}: MobileBottomNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  const handlePrimaryNav = (href: string) => {
    router.push(href)
    if (onClose) onClose()
  }

  const handleSecondaryAction = (id: string) => {
    onSecondaryAction?.(id)
    setShowMoreMenu(false)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Bottom Navigation Bar */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      >
        <div className="bg-white border-t border-gray-200 shadow-xl">
          {/* FAB - Floating Action Button */}
          <div className="absolute -top-14 left-1/2 -translate-x-1/2">
            <button
              onClick={() => handlePrimaryNav('/tasks/new')}
              className="w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
              aria-label="Create new task"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* Primary Navigation */}
          <div className="flex justify-around py-3 pt-16 pb-8">
            {primaryNavItems.map((item, index) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <motion.button
                  key={item.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handlePrimaryNav(item.href)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} />
                  <span className="text-xs font-medium">{item.label}</span>
                </motion.button>
              )
            })}

            {/* More Menu Trigger */}
            <motion.button
              key="more"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: primaryNavItems.length * 0.05 }}
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                showMoreMenu
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              aria-label="More options"
              aria-expanded={showMoreMenu}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-xs font-medium">More</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* More Menu Modal */}
      <AnimatePresence>
        {showMoreMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={() => setShowMoreMenu(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">More Options</h3>
                <button
                  onClick={() => setShowMoreMenu(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Secondary Actions Grid */}
              <div className="grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
                {secondaryNavItems.map((item, index) => {
                  const Icon = item.icon
                  const badge = item.badge ? (
                    item.id === 'notifications' ? notificationsCount : item.badge
                  ) : 0

                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handleSecondaryAction(item.id)}
                      className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors relative"
                      aria-label={item.label}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-xs font-medium text-center">{item.label}</span>
                      {badge > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                          {badge > 9 ? '9+' : badge}
                        </span>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice input modal */}
      <AnimatePresence>
        {false && ( // Disabled for now - can be enabled when voice input is ready
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {}}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full"
            >
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-24 h-24 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center"
                >
                  <Mic className="w-10 h-10 text-white" />
                </motion.div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">Listening...</h3>
                <p className="text-gray-600 mb-6">Speak your task naturally</p>

                <p className="text-sm text-gray-500 mb-6">
                  Examples: "Create task: Buy groceries tomorrow" or "Add meeting with team next Monday at 2pm"
                </p>

                <button
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}