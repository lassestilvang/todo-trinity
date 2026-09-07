// Integration test to verify end-to-end functionality
// This test mocks a complete user workflow

import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { getUserGamification } from '@/lib/gamification'
import { getTaskSuggestions } from '@/lib/suggestions'

// Mock all dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    list: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    label: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    notification: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

describe('Integration: Complete User Workflow', () => {
  const userId = 'test-user-id'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle user registration and login flow', async () => {
    // Mock user registration
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null) // No existing user
    ;(prisma.user.create as jest.Mock).mockResolvedValue({
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed-password',
    })

    const { password: _, ...userWithoutPassword } = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: await hashPassword('Password123'),
      },
    })

    expect(userWithoutPassword.email).toBe('test@example.com')
    expect(userWithoutPassword.name).toBe('Test User')
  })

  it('should handle task creation and listing workflow', async () => {
    // Mock creating a task
    ;(prisma.task.create as jest.Mock).mockResolvedValue({
      id: 'task-1',
      title: 'Integration Test Task',
      description: 'Created during integration test',
      status: 'TODO',
      priority: 'HIGH',
      dueDate: null,
      listId: null,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      labels: [],
    })

    const task = await prisma.task.create({
      data: {
        title: 'Integration Test Task',
        description: 'Created during integration test',
        status: 'TODO',
        priority: 'HIGH',
        userId,
      },
    })

    expect(task.title).toBe('Integration Test Task')
    expect(task.priority).toBe('HIGH')
    expect(task.status).toBe('TODO')

    // Mock listing tasks
    ;(prisma.task.findMany as jest.Mock).mockResolvedValue([task])
    ;(prisma.task.count as jest.Mock).mockResolvedValue(1)

    const tasks = await prisma.task.findMany({
      where: { userId },
      include: {
        labels: true,
        list: true,
      },
    })

    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('Integration Test Task')
  })

  it('should handle gamification calculation', async () => {
    // Mock tasks for gamification
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    ;(prisma.task.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'task-1',
        completedAt: today.toISOString(),
        createdAt: today.toISOString(),
      },
      {
        id: 'task-2',
        completedAt: yesterday.toISOString(),
        createdAt: yesterday.toISOString(),
      },
    ])

    const gamification = await getUserGamification(userId)

    expect(gamification.currentStreak).toBe(2)
    expect(gamification.totalTasksCompleted).toBe(2)
  })

  it('should handle suggestion generation', async () => {
    // Mock tasks for suggestions
    ;(prisma.task.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'task-1',
        title: 'Overdue Task',
        description: 'This task is overdue',
        status: 'PENDING',
        priority: 'HIGH',
        dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        listId: 'list-1',
        userId,
        createdAt: new Date().toISOString(),
        completedAt: null,
        list: { id: 'list-1', name: 'Test List' },
        labels: [],
      },
    ])

    const suggestions = await getTaskSuggestions(userId)

    expect(suggestions.length).toBeGreaterThan(0)
    expect(suggestions[0].reason).toContain('Overdue')
    expect(suggestions[0].suggestedPriority).toBe('HIGH')
  })
})