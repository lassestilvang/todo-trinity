import { TaskStatus, Priority, Task, List, Label } from '@/src/types/index'
import { useState, useEffect } from 'react'
import TaskList from '@/components/tasks/TaskList'
import AddTask from '@/components/tasks/AddTask'
import Sidebar from '@/components/layout/Sidebar'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedList, setSelectedList] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>(TaskStatus.TODO)
  const [selectedPriority, setSelectedPriority] = useState<Priority>(Priority.NORMAL)
  const [lists, setLists] = useState<List[]>([])
  const [labels, setLabels] = useState<Label[]>([])

  useEffect(() => {
    // Check if user is signed in
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/user-lists')
        if (!res.ok) {
          router.push('/auth/signin')
          return
        }
      } catch (error) {
        router.push('/auth/signin')
      }
    }

    checkAuth()
    fetchTasks()
    fetchLists()
    fetchLabels()
  }, [selectedList, selectedStatus, selectedPriority, router])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedList) params.append('listId', selectedList)
      params.append('status', selectedStatus)

      const res = await fetch(`/api/tasks?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch tasks')

      const data = await res.json()
      setTasks(data.tasks)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/user-lists')
      if (!res.ok) throw new Error('Failed to fetch lists')

      const data = await res.json()
      setLists(data.lists || [])
    } catch (error) {
      console.error('Error fetching lists:', error)
    }
  }

  const fetchLabels = async () => {
    try {
      const res = await fetch('/api/user-labels')
      if (!res.ok) throw new Error('Failed to fetch labels')

      const data = await res.json()
      setLabels(data.labels || [])
    } catch (error) {
      console.error('Error fetching labels:', error)
    }
  }

  const handleTaskCreate = async (taskData: Partial<Task>) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to create task')
      }

      const { task } = await res.json()
      setTasks(prevTasks => [task, ...prevTasks])
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!res.ok) throw new Error('Failed to update task')

      const { task } = await res.json()
      setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? task : task))
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleTaskDelete = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete task')

      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId))
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const res = await fetch('/api/auth/route', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword: password }),
      })

      if (res.ok) {
        router.push('/')
      } else {
        const error = await res.json()
        alert(error.message || 'Sign up failed')
      }
    } catch (error) {
      alert('Sign up failed')
    }
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
        lists={lists}
        labels={labels}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 p-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900">
              {selectedList ? 'Tasks' : 'All Tasks'}
            </h1>
            <p className="text-gray-600 mt-2">
              {tasks.length} tasks, {tasks.filter(t => t.status === TaskStatus.COMPLETED).length} completed
            </p>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <AddTask onCreate={handleTaskCreate} labels={labels} />
            <br />

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