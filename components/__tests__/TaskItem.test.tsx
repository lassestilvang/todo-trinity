import { render, screen, fireEvent } from '@testing-library/react'
import { TaskItem } from '@/components/tasks/TaskItem'
import type { Task } from '@/src/types/index'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

const mockTask: Task = {
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

describe('components/tasks/TaskItem', () => {
  const mockOnUpdate = jest.fn()
  const mockOnDelete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render task title', () => {
    render(<TaskItem task={mockTask} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('should render task description', () => {
    render(<TaskItem task={mockTask} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('should render priority badge', () => {
    render(<TaskItem task={mockTask} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)
    expect(screen.getByText('high')).toBeInTheDocument()
  })

  it('should call onUpdate when status changes', () => {
    render(<TaskItem task={mockTask} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    expect(mockOnUpdate).toHaveBeenCalledWith('task-1', expect.objectContaining({
      status: 'completed',
    }))
  })

  it('should call onDelete when delete button clicked', () => {
    render(<TaskItem task={mockTask} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)
    expect(mockOnDelete).toHaveBeenCalledWith('task-1')
  })

  it('should show completed styling when status is completed', () => {
    const completedTask = { ...mockTask, status: 'completed' as const }
    render(<TaskItem task={completedTask} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('should display due date when present', () => {
    const taskWithDate = { ...mockTask, dueDate: '2026-12-31T23:59:59.999Z' }
    render(<TaskItem task={taskWithDate} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)
    expect(screen.getByText('Dec 31, 2026')).toBeInTheDocument()
  })

  it('should display list name when list is present', () => {
    render(<TaskItem task={mockTask} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)
    expect(screen.getByText('Test List')).toBeInTheDocument()
  })

  it('should display labels when present', () => {
    const taskWithLabels = {
      ...mockTask,
      labels: [
        { id: 'label-1', name: 'Work', color: '#ff0000' },
        { id: 'label-2', name: 'Personal', color: '#00ff00' },
      ],
    }
    render(<TaskItem task={taskWithLabels} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)
    expect(screen.getByText('Work')).toBeInTheDocument()
    expect(screen.getByText('Personal')).toBeInTheDocument()
  })
})