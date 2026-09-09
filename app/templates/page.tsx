"use client"

import { useState } from 'react'
import { useTaskContext } from '@/src/hooks/useTasks'
import { useToast } from '@/src/hooks/useToast'
import { Check, Clock, TrendingUp, Users, Briefcase, Heart, Coffee, BookOpen, Dumbbell, Music } from 'lucide-react'

const templates = [
  {
    id: 'work-week',
    name: 'Work Week Planner',
    description: 'Organize your weekly tasks with priorities and time blocks',
    icon: <Briefcase className="w-6 h-6" />,
    color: 'bg-blue-50 border-blue-200',
    tasks: [
      { title: 'Project A - Complete proposal', priority: 'URGENT', status: 'TODO' },
      { title: 'Team meeting - Review sprint', priority: 'HIGH', status: 'TODO' },
      { title: 'Email clients - Follow up on quotes', priority: 'NORMAL', status: 'TODO' },
      { title: 'Update documentation', priority: 'LOW', status: 'TODO' },
    ]
  },
  {
    id: 'daily-goals',
    name: 'Daily Goals',
    description: 'Track your daily achievements and habits',
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'bg-green-50 border-green-200',
    tasks: [
      { title: 'Exercise for 30 minutes', priority: 'NORMAL', status: 'TODO' },
      { title: 'Read 50 pages of book', priority: 'LOW', status: 'TODO' },
      { title: 'Call family member', priority: 'NORMAL', status: 'TODO' },
      { title: 'Meal prep for the week', priority: 'HIGH', status: 'TODO' },
    ]
  },
  {
    id: 'home-projects',
    name: 'Home Improvement Projects',
    description: 'Manage your home maintenance and renovation tasks',
    icon: <Heart className="w-6 h-6" />,
    color: 'bg-red-50 border-red-200',
    tasks: [
      { title: 'Fix leaky kitchen faucet', priority: 'URGENT', status: 'TODO' },
      { title: 'Organize garage shelves', priority: 'HIGH', status: 'TODO' },
      { title: 'Replace burnt-out light fixtures', priority: 'NORMAL', status: 'TODO' },
      { title: 'Deep clean the oven', priority: 'LOW', status: 'TODO' },
    ]
  },
  {
    id: 'study-plan',
    name: 'Study Plan',
    description: 'Organize your learning and study sessions',
    icon: <BookOpen className="w-6 h-6" />,
    color: 'bg-purple-50 border-purple-200',
    tasks: [
      { title: 'Complete Chapter 5 - Advanced topics', priority: 'URGENT', status: 'TODO' },
      { title: 'Practice problems set 3', priority: 'HIGH', status: 'TODO' },
      { title: 'Review for midterm exam', priority: 'URGENT', status: 'TODO' },
      { title: 'Read research paper abstract', priority: 'NORMAL', status: 'TODO' },
    ]
  },
  {
    id: 'fitness-routine',
    name: 'Fitness Routine',
    description: 'Track your workouts and fitness goals',
    icon: <Dumbbell className="w-6 h-6" />,
    color: 'bg-orange-50 border-orange-200',
    tasks: [
      { title: 'Workout - Upper body strength', priority: 'HIGH', status: 'TODO' },
      { title: 'Cardio - 30 minutes jog', priority: 'NORMAL', status: 'TODO' },
      { title: 'Yoga session', priority: 'LOW', status: 'TODO' },
      { title: 'Hydration check - 8 glasses', priority: 'NORMAL', status: 'TODO' },
    ]
  },
  {
    id: 'relaxation-time',
    name: 'Relaxation Time',
    description: 'Schedule time for self-care and relaxation',
    icon: <Coffee className="w-6 h-6" />,
    color: 'bg-teal-50 border-teal-200',
    tasks: [
      { title: 'Meditate for 15 minutes', priority: 'NORMAL', status: 'TODO' },
      { title: 'Read fiction book', priority: 'LOW', status: 'TODO' },
      { title: 'Take bubble bath', priority: 'LOW', status: 'TODO' },
      { title: 'Call friend for coffee', priority: 'NORMAL', status: 'TODO' },
    ]
  },
  {
    id: 'creative-projects',
    name: 'Creative Projects',
    description: 'Manage your creative and artistic endeavors',
    icon: <Music className="w-6 h-6" />,
    color: 'bg-pink-50 border-pink-200',
    tasks: [
      { title: 'Write song - chorus draft', priority: 'HIGH', status: 'TODO' },
      { title: 'Paint landscape study', priority: 'LOW', status: 'TODO' },
      { title: 'Edit short story', priority: 'NORMAL', status: 'TODO' },
      { title: 'Record podcast episode', priority: 'URGENT', status: 'TODO' },
    ]
  },
  {
    id: 'budget-tracking',
    name: 'Budget & Finance',
    description: 'Organize your financial tracking and budget management',
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'bg-emerald-50 border-emerald-200',
    tasks: [
      { title: 'Review monthly expenses', priority: 'URGENT', status: 'TODO' },
      { title: 'Pay monthly bills', priority: 'HIGH', status: 'TODO' },
      { title: 'Update budget categories', priority: 'NORMAL', status: 'TODO' },
      { title: 'Save for emergency fund', priority: 'HIGH', status: 'TODO' },
    ]
  }
]

export default function TemplatesPage() {
  const { createTask, lists } = useTaskContext()
  const { addToast } = useToast()

  const applyTemplate = async (template: any) => {
    try {
      for (const taskData of template.tasks) {
        await createTask({
          title: taskData.title,
          description: `Imported from template: ${template.name}`,
          status: 'TODO',
          priority: taskData.priority as any,
        })
      }
      addToast(`Applied template: ${template.name}`, 'success')
    } catch (error) {
      addToast('Failed to apply template', 'error')
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Template Gallery</h1>
        <p className="text-gray-600">Start quickly with pre-built templates for common task lists</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`bg-white rounded-lg border-2 ${template.color} p-6 hover:shadow-lg transition-shadow cursor-pointer`}
            onClick={() => applyTemplate(template)}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                {template.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
            </div>

            <p className="text-gray-600 mb-4">{template.description}</p>

            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-medium text-gray-700">Typical Tasks:</h4>
              {template.tasks.map((task, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${task.priority === 'URGENT' ? 'bg-red-500' : task.priority === 'HIGH' ? 'bg-orange-500' : task.priority === 'NORMAL' ? 'bg-blue-500' : 'bg-green-500'}`} />
                  <span className="text-gray-600">{task.title}</span>
                  <span className="text-xs text-gray-400">({task.priority})</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                Apply Template
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Need a custom template?</h3>
        <p className="text-gray-600 mb-4">
          Don't see what you're looking for? You can create custom task lists by using the task form with common patterns,
          or we can build custom templates for your specific workflow.
        </p>
        <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors">
          Contact Us for Custom Templates
        </button>
      </div>
    </div>
  )
}