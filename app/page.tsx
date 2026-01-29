import { auth } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { prisma } from '@/lib/prisma'
import TaskList from '@/components/tasks/TaskList'
import AddTask from '@/components/tasks/AddTask'
import Sidebar from '@/components/layout/Sidebar'
import { TaskStatus, Priority } from '@/lib/types'

export default function Dashboard() {
  const { data: session } = auth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedList, setSelectedList] = useState('')
  const [selectedStatus, setSelectedStatus] = useState(TaskStatus.TODO)
  const [selectedPriority, setSelectedPriority] = useState(Priority.NORMAL)

  useEffect(() => {
    if (!session) {
      return
    }

    fetchTasks()
  }, [session])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const userTasks = await prisma.task.findMany({
        where: {
          userId: session?.user.id,
          listId: selectedList || null,
          status: selectedStatus,
        },
        include: {
          labels: true,
          list: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      setTasks(userTasks)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskCreate = async (taskData) => {
    try {
      const createdTask = await prisma.task.create({
        data: {
          ...taskData,
          userId: session?.user.id,
          listId: taskData.listId || null,
        },
        include: {
          labels: true,
          list: true,
        },
      })
      setTasks(prevTasks => [createdTask, ...prevTasks])
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleTaskUpdate = async (taskId, updates) => {
    try {
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: updates,
        include: {
          labels: true,
          list: true,
        },
      })
      setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? updatedTask : task))
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleTaskDelete = async (taskId) => {
    try {
      await prisma.task.delete({
        where: { id: taskId },
      })
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId))
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            Please sign in to access your tasks
          </h1>
          <a
            href="/auth/signin"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        selectedList={selectedList}
        selectedStatus={selectedStatus}
        selectedPriority={selectedPriority}
        onListChange={setSelectedList}
        onStatusChange={setSelectedStatus}
        onPriorityChange={setSelectedPriority}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 p-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900">
              {selectedList ? `List: ${selectedList}` : 'All Tasks'}
            </h1>
            <p className="text-gray-600 mt-2">
              {tasks.length} tasks, {tasks.filter(t => t.status === TaskStatus.COMPLETED).length} completed
            </p>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <AddTask onCreate={handleTaskCreate} /><br />
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <TaskList
                tasks={tasks}
                onUpdate={handleTaskUpdate}
                onDelete={handleTaskDelete}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  )
}