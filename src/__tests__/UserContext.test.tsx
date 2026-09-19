/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import { UserProvider, useUser } from '@/src/contexts/UserContext'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

// Mock next-auth/react to provide session data
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  SessionProvider: ({ children }: any) => <>{children}</>,
}))

const TestComponent = () => {
  const { user, loading, error, login, logout } = useUser()
  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'loaded'}</span>
      <span data-testid="user">{user?.email || 'no-user'}</span>
      <span data-testid="error">{error || 'no-error'}</span>
      <button data-testid="login-btn" onClick={() => login({ id: 'user-1', email: 'test@example.com', name: 'Test User' })}>Login</button>
      <button data-testid="logout-btn" onClick={logout}>Logout</button>
    </div>
  )
}

describe('src/contexts/UserContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear localStorage
    localStorage.clear()
  })

  describe('UserProvider', () => {
    it('should provide user context to children from localStorage', async () => {
      // Pre-populate localStorage
      localStorage.setItem('user', JSON.stringify({ id: 'user-1', email: 'test@example.com', name: 'Test User' }))

      render(
        <UserProvider>
          <TestComponent />
        </UserProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('test@example.com')
      })
    })

    it('should render with no user when localStorage is empty', async () => {
      render(
        <UserProvider>
          <TestComponent />
        </UserProvider>
      )

      // No stored user, so user is null and loading should complete
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('loaded')
        expect(screen.getByTestId('user').textContent).toBe('no-user')
      })
    })
  })

  describe('useUser hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = jest.fn()

      expect(() => {
        render(<TestComponent />)
      }).toThrow()

      console.error = originalError
    })
  })
})