import '@testing-library/jest-dom'
import { server } from './src/mocks/server'

// Establish API mocking before all tests
beforeAll(() => server.listen())
// Reset any runtime request handlers between tests
afterEach(() => server.resetHandlers())
// Clean up after all tests are done
afterAll(() => server.close())

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock crypto.randomUUID
if (!global.crypto) {
  (global as any).crypto = {}
}
if (!global.crypto.randomUUID) {
  (global as any).crypto.randomUUID = () => 'test-uuid-' + Math.random().toString(36).slice(2)
}