// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    task: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma'
import { getTaskSuggestions, parseNaturalLanguage } from '@/lib/suggestions'

describe('lib/suggestions', () => {
  const mockUserId = 'test-user-id'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getTaskSuggestions', () => {
    it('should return empty array when no tasks', async () => {
      (prisma.task.findMany as jest.Mock).mockResolvedValue([])

      const result = await getTaskSuggestions(mockUserId)

      expect(result).toEqual([])
    })

    it('should return overdue task suggestion', async () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      (prisma.task.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'task-1',
          title: 'Old Task',
          description: 'This is overdue',
          status: 'pending',
          priority: 'HIGH',
          dueDate: yesterday.toISOString(),
          listId: 'list-1',
          createdAt: yesterday.toISOString(),
          completedAt: null,
          list: { id: 'list-1', name: 'Test List' },
          labels: [],
        },
      ])

      const result = await getTaskSuggestions(mockUserId)

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Review 1 overdue task')
      expect(result[0].suggestedPriority).toBe('HIGH')
      expect(result[0].confidence).toBe(0.9)
      expect(result[0].reason).toBe('Overdue tasks detected')
    })

    it('should return high priority task suggestion', async () => {
      const today = new Date()

      (prisma.task.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'task-1',
          title: 'High Priority Task',
          description: 'Important work',
          status: 'pending',
          priority: 'URGENT',
          dueDate: null,
          listId: 'list-1',
          createdAt: today.toISOString(),
          completedAt: null,
          list: { id: 'list-1', name: 'Work List' },
          labels: [],
        },
      ])

      const result = await getTaskSuggestions(mockUserId)

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Focus on 1 high priority task')
      expect(result[0].suggestedPriority).toBe('HIGH')
      expect(result[0].confidence).toBe(0.85)
      expect(result[0].reason).toBe('High priority tasks pending')
    })

    it('should sort suggestions by confidence', async () => {
      const today = new Date()

      (prisma.task.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'task-1',
          title: 'Task 1',
          description: 'Description 1',
          status: 'pending',
          priority: 'HIGH',
          dueDate: null,
          listId: 'list-1',
          createdAt: today.toISOString(),
          completedAt: null,
          list: { id: 'list-1', name: 'List 1' },
          labels: [],
        },
        {
          id: 'task-2',
          title: 'Task 2',
          description: 'Description 2',
          status: 'pending',
          priority: 'LOW',
          dueDate: null,
          listId: 'list-1',
          createdAt: today.toISOString(),
          completedAt: null,
          list: { id: 'list-1', name: 'List 1' },
          labels: [],
        },
      ])

      const result = await getTaskSuggestions(mockUserId)

      // Should only return up to 5 suggestions
      expect(result).toHaveLength(2)
      // Should be sorted by confidence (higher first)
      expect(result[0].confidence).toBeGreaterThanOrEqual(result[1].confidence)
    })
  })

  describe('parseNaturalLanguage', () => {
    it('should parse urgent keyword', () => {
      const result = parseNaturalLanguage('Urgent task for today', 'user-id')
      expect(result).toMatchObject({
        title: 'Urgent task for today',
        priority: 'URGENT',
      })
    })

    it('should parse high priority keyword', () => {
      const result = parseNaturalLanguage('Important task tomorrow', 'user-id')
      expect(result).toMatchObject({
        title: 'Important task tomorrow',
        priority: 'HIGH',
      })
    })

    it('should parse low priority keyword', () => {
      const result = parseNaturalLanguage('Low priority task someday', 'user-id')
      expect(result).toMatchObject({
        title: 'Low priority task someday',
        priority: 'LOW',
      })
    })

    it('should parse today keyword', () => {
      const result = parseNaturalLanguage('Task for today', 'user-id')
      expect(result).toHaveProperty('dueDate')
      expect(result.dueDate).toBeInstanceOf(Date)
      // Should be today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      expect(result.dueDate?.getDate()).toBe(today.getDate())
      expect(result.dueDate?.getMonth()).toBe(today.getMonth())
    })

    it('should parse tomorrow keyword', () => {
      const result = parseNaturalLanguage('Task for tomorrow', 'user-id')
      expect(result).toHaveProperty('dueDate')
      expect(result.dueDate).toBeInstanceOf(Date)
      // Should be tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      expect(result.dueDate?.getDate()).toBe(tomorrow.getDate())
      expect(result.dueDate?.getMonth()).toBe(tomorrow.getMonth())
    })

    it('should return null for empty input', () => {
      const result = parseNaturalLanguage('', 'user-id')
      expect(result).toBeNull()
    })

    it('should return null for whitespace only input', () => {
      const result = parseNaturalLanguage('   ', 'user-id')
      expect(result).toBeNull()
    })

    it('should handle 12/25 date format', () => {
      const result = parseNaturalLanguage('Meeting 12/25', 'user-id')
      expect(result).toHaveProperty('dueDate')
      expect(result.dueDate).toBeInstanceOf(Date)
      expect(result.dueDate?.getMonth()).toBe(11) // December
      expect(result.dueDate?.getDate()).toBe(25)
    })

    it('should return default priority if no keywords', () => {
      const result = parseNaturalLanguage('Just a task', 'user-id')
      expect(result).toMatchObject({
        title: 'Just a task',
        priority: 'NORMAL',
      })
    })
  })
})