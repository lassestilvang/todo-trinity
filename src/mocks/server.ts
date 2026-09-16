// Mock server setup for testing - simplified without MSW
// Since the existing mock has no handlers, we keep this minimal

// Mock matchMedia globally is already handled in jest.setup.ts

// Empty setup - no API mocks needed for now
export const server = {
  listen: () => {},
  close: () => {},
  resetHandlers: () => {},
}