// This file contains the mock server setup for testing
// Since we can't run these tests without Jest installed, we'll create a minimal mock

import { setupServer } from 'msw/node'

export const server = setupServer(
  // Add your API mocks here
  // Example:
  // rest.get('/api/test', (req, res, ctx) => {
  //   return res(ctx.json({ test: 'data' }))
  // })
)

export { rest } from 'msw'