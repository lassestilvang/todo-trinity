"use client"

import { useState } from 'react'
import { TaskStatus, Priority, Notification } from '@/src/types/index'
import { Zap } from 'lucide-react'
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

export default function DashboardContent() {
  const taskContext = useTaskContext()
  const notificationsContext = useNotifications()
  const [activeView, setActiveView] = useState('tasks')
  const { workspaces, currentWorkspace } = useWorkspaceContext()
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
                onClick={() => setShowAIPrioritySuggestions(!showAIPrioritySuggestions)}
                className={`px-4 py-2 rounded ${showAIPrioritySuggestions ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                AI Suggestions
              </button>
              <button
                onClick={() => setShowConflictDetection(!showConflictDetection)}
                className={`px-4 py-2 rounded ${showConflictDetection ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Schedule Check
              </button>
              <button
                onClick={() => setShowCollaboration(!showCollaboration)}
                className={`px-4 py-2 rounded ${showCollaboration ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Collaborate
              </button>
              <button
                onClick={() => setShowAutomationPanel(!showAutomationPanel)}
                className={`px-4 py-2 rounded ${showAutomationPanel ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Automation
              </button>
              <button
                onClick={() => setShowActivity(!showActivity)}
                className={`px-4 py-2 rounded ${showActivity ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Activity
              </button>
              <button
                onClick={() => setShowFocusMode(!showFocusMode)}
                className={`px-4 py-2 rounded ${showFocusMode ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Focus
              </button>
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`px-4 py-2 rounded ${showSearch ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Search
              </button>
              {currentWorkspace && (
                <WorkspacePresence workspaceId={currentWorkspace.id} />
              )}
              <RealtimeStatus workspaceId={currentWorkspace?.id} />
              <button
                onClick={() => setShowMentions(!showMentions)}
                className={`px-4 py-2 rounded ${showMentions ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Mentions ({notificationsContext.notifications.filter((n: Notification) => !n.read).length})
              </button>
              <button
                onClick={() => setActiveView('analytics')}
                className={`px-4 py-2 rounded ${activeView === 'analytics' ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Analytics
              </button>
              <button
                onClick={() => setShowProductivityAnalytics(!showProductivityAnalytics)}
                className={`px-4 py-2 rounded ${showProductivityAnalytics ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Insights & Analytics
              </button>
              <button
                onClick={() => setShowAITaskDecomposer(!showAITaskDecomposer)}
                className={`px-4 py-2 rounded ${showAITaskDecomposer ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                AI Decompose
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