/// <reference types="jest" />

import '@testing-library/jest-dom'
// Polyfill Web Request/Response/Headers for jsdom test environment (needed by Next.js route handlers)
if (typeof (global as any).Request === 'undefined') {
  (global as any).Request = (globalThis as any).Request
}
if (typeof (global as any).Response === 'undefined') {
  (global as any).Response = (globalThis as any).Response
}
if (typeof (global as any).Headers === 'undefined') {
  (global as any).Headers = (globalThis as any).Headers
}
if (typeof (global as any).fetch === 'undefined') {
  (global as any).fetch = (globalThis as any).fetch
}
import { server } from './src/mocks/server'

// Establish API mocking before all tests
beforeAll(() => server.listen())
// Reset any runtime request handlers between tests
afterEach(() => server.resetHandlers())
// Clean up after all tests are done
afterAll(() => server.close())

// Mock window.matchMedia (only in jsdom environments)
if (typeof window !== 'undefined') {
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
}

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
