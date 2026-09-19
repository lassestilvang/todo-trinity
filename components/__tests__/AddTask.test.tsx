/**
 * @jest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, fireEvent } from '@testing-library/react'
import AddTask from '@/components/tasks/AddTask'
import { ReactNode } from 'react'

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

const mockOnCreate = jest.fn()

const mockOnCancel = jest.fn()

describe('components/tasks/AddTask', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render title input and add button', () => {
    render(<AddTask onCreate={mockOnCreate} />)
    expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
  })

  it('should submit task when form is valid', () => {
    render(<AddTask onCreate={mockOnCreate} />)

    fireEvent.change(
      screen.getByPlaceholderText('What needs to be done?'),
      { target: { value: 'New Task' } }
    )
    fireEvent.click(screen.getByRole('button', { name: /add/i }))

    expect(mockOnCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New Task',
        description: undefined,
      })
    )
  })

  it('should handle clear', () => {
    render(<AddTask onCreate={mockOnCreate} />)

    fireEvent.change(
      screen.getByPlaceholderText('What needs to be done?'),
      { target: { value: 'New Task' } }
    )
    fireEvent.click(screen.getByRole('button', { name: /clear/i }))

    expect(screen.getByPlaceholderText('What needs to be done?')).toHaveValue('')
  })

  it('should not submit empty task', () => {
    render(<AddTask onCreate={mockOnCreate} />)
    fireEvent.click(screen.getByRole('button', { name: /add/i }))

    expect(mockOnCreate).not.toHaveBeenCalled()
  })

  it('should have priority options when expanded', () => {
    render(<AddTask onCreate={mockOnCreate} />)

    fireEvent.click(screen.getByRole('button', { name: /more/i }))

    expect(screen.getByRole('option', { name: 'Low' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Normal' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'High' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Urgent' })).toBeInTheDocument()
  })
})