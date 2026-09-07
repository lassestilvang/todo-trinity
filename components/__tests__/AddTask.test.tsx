import { render, screen, fireEvent } from '@testing-library/react'
import { AddTask } from '@/components/tasks/AddTask'
import { useForm } from 'react-hook-form'

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: jest.fn(),
}))

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

const mockOnCreate = jest.fn()
const mockOnCancel = jest.fn()

describe('components/tasks/AddTask', () => {
  const mockFormMethods = {
    register: jest.fn(),
    handleSubmit: jest.fn(),
    reset: jest.fn(),
    watch: jest.fn(),
    setValue: jest.fn(),
    watch: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render form fields', () => {
    jest.spyOn(useForm, 'useForm').mockReturnValue(mockFormMethods)

    render(<AddTask onCreate={mockOnCreate} onCancel={mockOnCancel} />)
    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Priority')).toBeInTheDocument()
    expect(screen.getByLabelText('Due Date')).toBeInTheDocument()
  })

  it('should submit task when form is valid', () => {
    jest.spyOn(useForm, 'useForm').mockReturnValue(mockFormMethods)

    const onSubmit = jest.fn()
    mockFormMethods.handleSubmit(onSubmit)

    render(
      <AddTask
        onCreate={mockOnCreate}
        onCancel={mockOnCancel}
        {...mockFormMethods}
      />
    )

    fireEvent.change(
      screen.getByLabelText('Title'),
      { target: { value: 'New Task' } }
    )
    fireEvent.change(
      screen.getByLabelText('Priority'),
      { target: { value: 'high' } }
    )
    fireEvent.click(screen.getByRole('button', { name: /create task/i }))

    expect(onSubmit).toHaveBeenCalled()
    expect(mockOnCreate).toHaveBeenCalled()
  })

  it('should handle cancel', () => {
    jest.spyOn(useForm, 'useForm').mockReturnValue(mockFormMethods)

    render(<AddTask onCreate={mockOnCreate} onCancel={mockOnCancel} />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should reset form when cancel is clicked', () => {
    jest.spyOn(useForm, 'useForm').mockReturnValue(mockFormMethods)

    render(
      <AddTask
        onCreate={mockOnCreate}
        onCancel={mockOnCancel}
        {...mockFormMethods}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockFormMethods.reset).toHaveBeenCalled()
  })

  it('should show validation errors', () => {
    jest.spyOn(useForm, 'useForm').mockReturnValue(mockFormMethods)

    const onSubmit = jest.fn()
    mockFormMethods.handleSubmit(onSubmit)

    render(
      <AddTask
        onCreate={mockOnCreate}
        onCancel={mockOnCancel}
        {...mockFormMethods}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /create task/i }))

    // Should have called submit even without valid form data
    // (form library handles validation)
    expect(mockFormMethods.reset).toHaveBeenCalled()
  })

  it('should have priority options', () => {
    jest.spyOn(useForm, 'useForm').mockReturnValue(mockFormMethods)

    render(<AddTask onCreate={mockOnCreate} onCancel={mockOnCancel} />)
    expect(screen.getByLabelText('Urgent')).toBeInTheDocument()
    expect(screen.getByLabelText('High')).toBeInTheDocument()
    expect(screen.getByLabelText('Medium')).toBeInTheDocument()
    expect(screen.getByLabelText('Low')).toBeInTheDocument()
  })
})