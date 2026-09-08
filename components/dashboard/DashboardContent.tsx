"use client"

import { useState } from 'react'
import { TaskStatus, Priority } from '@/src/types/index'
import { useTaskContext } from '@/src/hooks/useTasks'
import { useNotifications } from '@/src/hooks/useLists'
import TaskList from '@/components/tasks/TaskList'
import AddTask from '@/components/tasks/AddTask'
import Sidebar from '@/components/layout/Sidebar'
import ActivityPanel from '@/components/dashboard/ActivityPanel'
import AnalyticsPanel from '@/components/dashboard/AnalyticsPanel'
import SuggestionsPanel from '@/components/dashboard/SuggestionsPanel'
import GamificationPanel from '@/components/dashboard/GamificationPanel'
import NotificationsPanel from '@/components/dashboard/NotificationsPanel'
import CalendarView from '@/components/calendar/CalendarView'
import GanttView from '@/components/views/GanttView'
import KanbanBoard from '@/components/views/KanbanBoard'

export default function DashboardContent() {
  const taskContext = useTaskContext()
  const notificationsContext = useNotifications()
  const [activeView, setActiveView] = useState('tasks')
  const [showActivity, setShowActivity] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showGamification, setShowGamification] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showGantt, setShowGantt] = useState(false)
  const [showKanban, setShowKanban] = useState(false)

  if (taskContext.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const getSelectedViewComponent = () => {
    switch (activeView) {
      case 'tasks':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Tasks</h2>
              <AddTask onCreate={taskContext.createTask} labels={taskContext.labels} />
              <br />
              <TaskList
                tasks={taskContext.tasks}
                onUpdate={taskContext.updateTask}
                onDelete={taskContext.deleteTask}
              />
            </div>
          </div>
        )
      case 'calendar':
        return <CalendarView />
      case 'gantt':
        return <GanttView />
      case 'kanban':
        return <KanbanBoard />
      case 'activity':
        return <ActivityPanel onClose={() => setActiveView('tasks')} />
      case 'analytics':
        return <AnalyticsPanel onClose={() => setActiveView('tasks')} />
      case 'suggestions':
        return <SuggestionsPanel onClose={() => setActiveView('tasks')} />
      case 'gamification':
        return <GamificationPanel onClose={() => setActiveView('tasks')} />
      case 'notifications':
        return <NotificationsPanel onClose={() => setActiveView('tasks')} />
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <Sidebar
        selectedList={taskContext.selectedList}
        selectedStatus={taskContext.selectedStatus}
        selectedPriority={taskContext.selectedPriority}
        onListChange={(listId) => taskContext.setFilters({ listId })}
        onStatusChange={(status) => taskContext.setFilters({ status })}
        onPriorityChange={(priority) => taskContext.setFilters({ priority })}
        lists={taskContext.lists}
        labels={taskContext.labels}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveView('tasks')}
                className={`px-4 py-2 rounded ${activeView === 'tasks' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Tasks
              </button>
              <button
                onClick={() => setActiveView('calendar')}
                className={`px-4 py-2 rounded ${activeView === 'calendar' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Calendar
              </button>
              <button
                onClick={() => setActiveView('gantt')}
                className={`px-4 py-2 rounded ${activeView === 'gantt' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Gantt
              </button>
              <button
                onClick={() => setActiveView('kanban')}
                className={`px-4 py-2 rounded ${activeView === 'kanban' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Kanban
              </button>
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className={`px-4 py-2 rounded ${showSuggestions ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Suggestions
              </button>
              <button
                onClick={() => setShowGamification(!showGamification)}
                className={`px-4 py-2 rounded ${showGamification ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Gamification
              </button>
              <button
                onClick={() => setShowActivity(!showActivity)}
                className={`px-4 py-2 rounded ${showActivity ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Activity
              </button>
              <button
                onClick={() => setActiveView('analytics')}
                className={`px-4 py-2 rounded ${activeView === 'analytics' ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveView('notifications')}
                className={`px-4 py-2 rounded ${activeView === 'notifications' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Notifications ({notificationsContext.notifications.length})
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <section className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            {getSelectedViewComponent()}
          </div>
        </section>

        {/* Side Panels */}
        {showSuggestions && (
          <SuggestionsPanel
            onClose={() => setShowSuggestions(false)}
          />
        )}
        {showGamification && (
          <GamificationPanel
            onClose={() => setShowGamification(false)}
          />
        )}
        {showActivity && (
          <ActivityPanel
            onClose={() => setShowActivity(false)}
          />
        )}
      </main>
    </div>
  )
}