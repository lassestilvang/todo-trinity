/**
 * @jest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReactNode } from 'react'
import TaskItem from '@/components/tasks/TaskItem'

// Create a test wrapper with QueryClientProvider
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('components/tasks/TaskItem', () => {
  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'pending',
    priority: 'high',
    dueDate: null,
    listId: 'list-1',
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    labels: [],
    list: { id: 'list-1', name: 'Test List' },
  }

  it('should render task title', () => {
    render(<TaskItem task={mockTask} onStatusChange={() => {}} onPriorityChange={() => {}} onDelete={() => {}} onCommentsOpen={() => {}} />, { wrapper: TestWrapper })
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('should render task description', () => {
    render(<TaskItem task={mockTask} onStatusChange={() => {}} onPriorityChange={() => {}} onDelete={() => {}} onCommentsOpen={() => {}} />, { wrapper: TestWrapper })
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('should render priority select with options', () => {
    render(<TaskItem task={mockTask} onStatusChange={() => {}} onPriorityChange={() => {}} onDelete={() => {}} onCommentsOpen={() => {}} />, { wrapper: TestWrapper })
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'High' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Urgent' })).toBeInTheDocument()
  })

  it('should render status toggle button', () => {
    render(<TaskItem task={mockTask} onStatusChange={() => {}} onPriorityChange={() => {}} onDelete={() => {}} onCommentsOpen={() => {}} />, { wrapper: TestWrapper })
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
  })

  it('should render delete button', () => {
    render(<TaskItem task={mockTask} onStatusChange={() => {}} onPriorityChange={() => {}} onDelete={() => {}} onCommentsOpen={() => {}} />, { wrapper: TestWrapper })
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('should display due date when present', () => {
    const taskWithDate = {
      ...mockTask,
      dueDate: '2026-12-31T23:59:59.999Z',
    }
    render(<TaskItem task={taskWithDate} onStatusChange={() => {}} onPriorityChange={() => {}} onDelete={() => {}} onCommentsOpen={() => {}} />, { wrapper: TestWrapper })
    const dateStr = new Date('2026-12-31T23:59:59.999Z').toLocaleDateString()
    expect(screen.getByText(dateStr)).toBeInTheDocument()
  })

  it('should display labels when present', () => {
    const taskWithLabels = {
      ...mockTask,
      labels: [
        { id: 'label-1', name: 'Work', color: '#ff0000' },
        { id: 'label-2', name: 'Personal', color: '#00ff00' },
      ],
    }
    render(<TaskItem task={taskWithLabels} onStatusChange={() => {}} onPriorityChange={() => {}} onDelete={() => {}} onCommentsOpen={() => {}} />, { wrapper: TestWrapper })
    expect(screen.getByText('Work')).toBeInTheDocument()
    expect(screen.getByText('Personal')).toBeInTheDocument()
  })

  it('should have Urgent priority option', () => {
    render(<TaskItem task={mockTask} onStatusChange={() => {}} onPriorityChange={() => {}} onDelete={() => {}} onCommentsOpen={() => {}} />, { wrapper: TestWrapper })
    expect(screen.getByRole('option', { name: 'Urgent' })).toBeInTheDocument()
  })
})