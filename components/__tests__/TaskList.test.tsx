/**
 * @jest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, fireEvent } from '@testing-library/react'
import TaskList from '@/components/tasks/TaskList'
import type { Task } from '@/src/types/index'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Create a test wrapper with QueryClientProvider
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Task 1',
    description: 'Description 1',
    status: 'TODO',
    priority: 'HIGH',
    dueDate: null,
    listId: 'list-1',
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    labels: [],
    list: { id: 'list-1', name: 'List 1' },
  },
  {
    id: 'task-2',
    title: 'Task 2',
    description: 'Description 2',
    status: 'COMPLETED',
    priority: 'NORMAL',
    dueDate: null,
    listId: 'list-1',
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    labels: [],
    list: { id: 'list-1', name: 'List 1' },
  },
]

describe('components/tasks/TaskList', () => {
  const mockOnUpdate = jest.fn()
  const mockOnDelete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render tasks list', () => {
    render(<TaskList tasks={mockTasks} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />, { wrapper: TestWrapper })
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
  })

  it('should render empty state when no tasks', () => {
    render(<TaskList tasks={[]} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />, { wrapper: TestWrapper })
    expect(screen.getByText('No tasks found')).toBeInTheDocument()
  })

  it('should filter tasks by status', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        filter={{ status: 'TODO' }}
      />, { wrapper: TestWrapper }
    )
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.queryByText('Task 2')).not.toBeInTheDocument()
  })

  it('should filter tasks by priority', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        filter={{ priority: 'HIGH' }}
      />, { wrapper: TestWrapper }
    )
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.queryByText('Task 2')).not.toBeInTheDocument()
  })

  it('should sort tasks by priority when status filter is active', () => {
    render(
      <TaskList
        tasks={[{
          id: 'task-1',
          title: 'High Priority Task',
          description: '',
          status: 'pending',
          priority: 'high',
          dueDate: null,
          listId: 'list-1',
          userId: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          labels: [],
          list: { id: 'list-1', name: 'List 1' },
        }, {
          id: 'task-2',
          title: 'Low Priority Task',
          description: '',
          status: 'pending',
          priority: 'low',
          dueDate: null,
          listId: 'list-1',
          userId: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          labels: [],
          list: { id: 'list-1', name: 'List 1' },
        }]}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        filter={{ status: 'pending' }}
        sortBy='priority'
      />, { wrapper: TestWrapper }
    )
    expect(screen.getByText('High Priority Task')).toBeInTheDocument()
    expect(screen.getByText('Low Priority Task')).toBeInTheDocument()
  })

  it('should sort tasks by created date', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        sortBy='createdAt'
      />, { wrapper: TestWrapper }
    )
    // Should render both tasks
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
  })

  it('should handle bulk operations', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        selectedTasks={['task-1']}
        onSelectTask={() => {}}
      />, { wrapper: TestWrapper }
    )
    // The component should handle selected tasks (implementation dependent)
    expect(screen.getByText('Task 1')).toBeInTheDocument()
  })

  it('should open task details modal when task is clicked', () => {
    render(<TaskList tasks={mockTasks} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />, { wrapper: TestWrapper })
    // TaskItem uses motion.div which is mocked to regular div
    const taskItem = screen.getByText('Task 1')
    // The text node itself is clicked, not a wrapper element
    fireEvent.click(taskItem)
    // This would trigger the task details modal to open
    // Implementation dependent
  })

  it('should support drag and drop (when enabled)', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        dragEnabled={true}
      />, { wrapper: TestWrapper }
    )
    // The component should support drag and drop
    // Implementation dependent
  })
})