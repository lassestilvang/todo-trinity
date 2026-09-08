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
  Plus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface MobileNavigationProps {
  isOpen?: boolean
  onClose?: () => void
}

const navItems = [
  { href: '/', label: 'Today', icon: Home, badge: 0 },
  { href: '/views/calendar', label: 'Calendar', icon: Calendar, badge: 0 },
  { href: '/views/kanban', label: 'Kanban', icon: Kanban, badge: 0 },
  { href: '/views/gantt', label: 'Gantt', icon: GanttChartSquare, badge: 0 },
  { href: '/analytics', label: 'Analytics', icon: BarChart2, badge: 0 },
]

export default function MobileNavigation({ isOpen = true, onClose }: MobileNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isVoiceOpen, setIsVoiceOpen] = useState(false)

  const handleNavigation = (href: string) => {
    router.push(href)
    if (onClose) onClose()
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
          >
            <div className="bg-white border-t border-gray-200 rounded-t-2xl shadow-xl">
              {/* FAB - Floating Action Button */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2">
                <button
                  onClick={() => handleNavigation('/tasks/new')}
                  className="w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
                  aria-label="Create new task"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>

              {/* Navigation items */}
              <div className="flex justify-around py-4 pt-20 pb-6">
                {navItems.map((item, index) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon

                  return (
                    <motion.button
                      key={item.href}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleNavigation(item.href)}
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
                      {item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </motion.button>
                  )
                })}
              </div>

              {/* Quick actions */}
              <div className="flex justify-around border-t border-gray-100 py-4">
                <button
                  onClick={() => setIsVoiceOpen(true)}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  aria-label="Voice input"
                >
                  <Mic className="w-5 h-5" />
                  <span className="text-xs font-medium">Voice</span>
                </button>

                <button
                  onClick={() => handleNavigation('/search')}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                  <span className="text-xs font-medium">Search</span>
                </button>

                <button
                  onClick={() => handleNavigation('/settings')}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  aria-label="Settings"
                >
                  <Settings className="w-5 h-5" />
                  <span className="text-xs font-medium">Settings</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice input modal */}
      <AnimatePresence>
        {isVoiceOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsVoiceOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
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
                  onClick={() => setIsVoiceOpen(false)}
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