import { render, screen, waitFor } from '@testing-library/react'
import { UserProvider, useUser } from '@/src/contexts/UserContext'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  SessionProvider: ({ children }: any) => <>{children}</>,
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

const TestComponent = () => {
  const { user, loading, error } = useUser()
  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'loaded'}</span>
      <span data-testid="user">{user?.email || 'no-user'}</span>
      <span data-testid="error">{error || 'no-error'}</span>
    </div>
  )
}

describe('src/contexts/UserContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('UserProvider', () => {
    it('should provide user context to children', async () => {
      const mockSession = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
        },
      }

      // @ts-ignore - need to mock the useSession return
      require('next-auth/react').useSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      })

      render(
        <UserProvider>
          <TestComponent />
        </UserProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('test@example.com')
      })
    })

    it('should handle loading state', async () => {
      // @ts-ignore
      require('next-auth/react').useSession.mockReturnValue({
        data: null,
        status: 'loading',
      })

      render(
        <UserProvider>
          <TestComponent />
        </UserProvider>
      )

      expect(screen.getByTestId('loading').textContent).toBe('loading')
    })

    it('should handle unauthenticated state', async () => {
      // @ts-ignore
      require('next-auth/react').useSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(
        <UserProvider>
          <TestComponent />
        </UserProvider>
      )

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