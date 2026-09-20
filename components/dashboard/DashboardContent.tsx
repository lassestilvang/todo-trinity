"use client"

import { useState, useEffect } from 'react'
import { TaskStatus, Priority, Notification } from '@/src/types/index'
import { Zap, Menu, X } from 'lucide-react'
import { useTaskContext } from '@/src/contexts'
import { useUser } from '@/src/contexts'
import WorkspacePresence from '@/components/workspace/WorkspacePresence'
import { useWorkspaceContext } from '@/src/contexts/WorkspaceContext'
import { useNotifications } from '@/src/hooks/useLists'
import TaskList from '@/components/tasks/TaskList'
import AddTask from '@/components/tasks/AddTask'
import Sidebar from '@/components/layout/Sidebar'
import ActivityPanel from '@/components/dashboard/ActivityPanel'
import AnalyticsPanel from '@/components/dashboard/AnalyticsPanel'
import ProductivityAnalytics from '@/components/dashboard/ProductivityAnalytics'
import AITaskDecomposer from '@/components/dashboard/AITaskDecomposer'
import SuggestionsPanel from '@/components/dashboard/SuggestionsPanel'
import GamificationPanel from '@/components/dashboard/GamificationPanel'
import NotificationsPanel from '@/components/dashboard/NotificationsPanel'
import MentionsPanel from '@/components/dashboard/MentionsPanel'
import SearchPanel from '@/components/dashboard/SearchPanel'
import FocusMode from '@/components/dashboard/FocusMode'
import CalendarView from '@/components/calendar/CalendarView'
import GanttView from '@/components/views/GanttView'
import KanbanBoard from '@/components/views/KanbanBoard'
import RealtimeStatus from '@/components/dashboard/RealtimeStatus'
import AIPrioritySuggestions from '@/components/dashboard/AIPrioritySuggestions'
import ConflictDetectionPanel from '@/components/dashboard/ConflictDetectionPanel'
import CollaborationPanel from '@/components/dashboard/CollaborationPanel'
import WorkflowBuilder from '@/components/automation/WorkflowBuilder'
import AutomationPanel from '@/components/automation/AutomationPanel'
import MobileBottomNav from '@/components/dashboard/MobileBottomNav'
import DailyPlanner from '@/components/dashboard/DailyPlanner'

export default function DashboardContent() {
  const taskContext = useTaskContext()
  const notificationsContext = useNotifications()
  const { workspaces, currentWorkspace } = useWorkspaceContext()
  const [activeView, setActiveView] = useState('tasks')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [showActivity, setShowActivity] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showGamification, setShowGamification] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showGantt, setShowGantt] = useState(false)
  const [showKanban, setShowKanban] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showFocusMode, setShowFocusMode] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [showProductivityAnalytics, setShowProductivityAnalytics] = useState(false)
  const [showAITaskDecomposer, setShowAITaskDecomposer] = useState(false)
  const [showDailyPlanner, setShowDailyPlanner] = useState(false)
  const [showAIPrioritySuggestions, setShowAIPrioritySuggestions] = useState(false)
  const [showConflictDetection, setShowConflictDetection] = useState(false)
  const [showCollaboration, setShowCollaboration] = useState(false)
  const [showAutomation, setShowAutomation] = useState(false)
  const [showAutomationPanel, setShowAutomationPanel] = useState(false)

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
              <AddTask onCreate={(taskData: any) => taskContext.createTask({...taskData, labels: []})} />
              <br />
              <TaskList
                tasks={taskContext.tasks}
                onUpdate={taskContext.updateTask}
                onDelete={taskContext.deleteTask}
                onCommentsOpen={(taskId: string) => console.log('Open comments for task:', taskId)}
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
      <main className="flex-1 flex flex-col overflow-hidden pb-20 md:pb-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Desktop Header Actions */}
            <div className="hidden md:flex md:items-center md:space-x-2">
              {/* Primary View Buttons */}
              <div className="flex space-x-1 border-r border-gray-200 pr-4 mr-4">
                <button
                  onClick={() => setActiveView('tasks')}
                  className={`px-3 py-1.5 rounded ${activeView === 'tasks' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Tasks
                </button>
                <button
                  onClick={() => setActiveView('calendar')}
                  className={`px-3 py-1.5 rounded ${activeView === 'calendar' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Calendar
                </button>
                <button
                  onClick={() => setActiveView('kanban')}
                  className={`px-3 py-1.5 rounded ${activeView === 'kanban' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Kanban
                </button>
                <button
                  onClick={() => setActiveView('gantt')}
                  className={`px-3 py-1.5 rounded ${activeView === 'gantt' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Gantt
                </button>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex space-x-1 border-r border-gray-200 pr-4 mr-4">
                <button
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className={`px-3 py-1.5 rounded ${showSuggestions ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Suggestions
                </button>
                <button
                  onClick={() => setShowGamification(!showGamification)}
                  className={`px-3 py-1.5 rounded ${showGamification ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Gamification
                </button>
                <button
                  onClick={() => setShowAIPrioritySuggestions(!showAIPrioritySuggestions)}
                  className={`px-3 py-1.5 rounded ${showAIPrioritySuggestions ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  AI Suggestions
                </button>
                <button
                  onClick={() => setShowConflictDetection(!showConflictDetection)}
                  className={`px-3 py-1.5 rounded ${showConflictDetection ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Schedule Check
                </button>
              </div>

              {/* Collaboration & Tools */}
              <div className="flex space-x-1 border-r border-gray-200 pr-4 mr-4">
                <button
                  onClick={() => setShowCollaboration(!showCollaboration)}
                  className={`px-3 py-1.5 rounded ${showCollaboration ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Collaborate
                </button>
                <button
                  onClick={() => setShowAutomationPanel(!showAutomationPanel)}
                  className={`px-3 py-1.5 rounded ${showAutomationPanel ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Automation
                </button>
                <button
                  onClick={() => setShowActivity(!showActivity)}
                  className={`px-3 py-1.5 rounded ${showActivity ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Activity
                </button>
              </div>

              {/* Focus & Search */}
              <div className="flex space-x-1 border-r border-gray-200 pr-4 mr-4">
                <button
                  onClick={() => setShowFocusMode(!showFocusMode)}
                  className={`px-3 py-1.5 rounded ${showFocusMode ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Focus
                </button>
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className={`px-3 py-1.5 rounded ${showSearch ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Search
                </button>
              </div>

              {/* Workspace & Notifications */}
              <div className="flex items-center space-x-2">
                {currentWorkspace && (
                  <WorkspacePresence workspaceId={currentWorkspace.id} />
                )}
                <RealtimeStatus workspaceId={currentWorkspace?.id} />
                <button
                  onClick={() => setShowMentions(!showMentions)}
                  className={`px-3 py-1.5 rounded ${showMentions ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Mentions ({notificationsContext.notifications.filter((n: Notification) => !n.read).length})
                </button>
                <button
                  onClick={() => setActiveView('analytics')}
                  className={`px-3 py-1.5 rounded ${activeView === 'analytics' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Analytics
                </button>
                <button
                  onClick={() => setShowProductivityAnalytics(!showProductivityAnalytics)}
                  className={`px-3 py-1.5 rounded ${showProductivityAnalytics ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Insights
                </button>
                <button
                  onClick={() => setShowAITaskDecomposer(!showAITaskDecomposer)}
                  className={`px-3 py-1.5 rounded ${showAITaskDecomposer ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  AI Decompose
                </button>
                <button
                  onClick={() => setShowDailyPlanner(!showDailyPlanner)}
                  className={`px-3 py-1.5 rounded ${showDailyPlanner ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Daily Plan
                </button>
                <button
                  onClick={() => setActiveView('notifications')}
                  className={`px-3 py-1.5 rounded ${activeView === 'notifications' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Notifications ({notificationsContext.notifications.length})
                </button>
              </div>
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
        {showSearch && (
          <SearchPanel
            onClose={() => setShowSearch(false)}
          />
        )}
        {showFocusMode && (
          <FocusMode
            onClose={() => setShowFocusMode(false)}
          />
        )}
        {showMentions && (
          <MentionsPanel
            onClose={() => setShowMentions(false)}
          />
        )}
        {showProductivityAnalytics && (
          <ProductivityAnalytics
            onClose={() => setShowProductivityAnalytics(false)}
          />
        )}
        {showAITaskDecomposer && (
          <AITaskDecomposer
            onClose={() => setShowAITaskDecomposer(false)}
          />
        )}
        {mobileSidebarOpen && (
          <MobileBottomNav
            isOpen={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
            notificationsCount={notificationsContext.notifications.filter((n: Notification) => !n.read).length}
            onSecondaryAction={(id: string) => {
              switch (id) {
                case 'gantt': setActiveView('gantt'); break
                case 'suggestions': setShowSuggestions(true); break
                case 'gamification': setShowGamification(true); break
                case 'focus': setShowFocusMode(true); break
                case 'collaboration': setShowCollaboration(true); break
                case 'automation': setShowAutomationPanel(true); break
                case 'search': setShowSearch(true); break
                case 'notifications': setActiveView('notifications'); break
                case 'mentions': setShowMentions(true); break
                case 'settings': window.location.href = '/settings'; break
                default: break
              }
            }}
          />
        )}
        {showAIPrioritySuggestions && (
          <AIPrioritySuggestions />
        )}
        {showConflictDetection && (
          <ConflictDetectionPanel />
        )}
        {showCollaboration && (
          <CollaborationPanel workspaceId={currentWorkspace?.id} />
        )}
        {showAutomation && (
          <WorkflowBuilder />
        )}
        {showAutomationPanel && (
          <AutomationPanel onClose={() => setShowAutomationPanel(false)} />
        )}
      </main>
    </div>
  )
}