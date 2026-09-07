import {
  broadcastTaskCreate,
  broadcastTaskUpdate,
  broadcastTaskDelete,
  getRecentEvents,
} from '@/lib/realtime'
import type { Task } from '@/src/types/index'

describe('lib/realtime', () => {
  // Mock crypto.randomUUID for predictable IDs
  beforeEach(() => {
    jest.spyOn(global as any, 'crypto', 'get').mockReturnValue({
      randomUUID: jest.fn().mockReturnValue('test-uuid'),
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const mockTask: Task = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'pending',
    priority: 'medium',
    dueDate: null,
    listId: 'list-1',
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  describe('broadcastTaskCreate', () => {
    it('should add a task_created event to recentEvents', () => {
      broadcastTaskCreate(mockTask)
      const events = getRecentEvents()
      expect(events).toHaveLength(1)
      expect(events[0]).toMatchObject({
        id: 'test-uuid',
        type: 'task_created',
        task: {
          id: 'task-1',
          title: 'Test Task',
          description: 'Test Description',
          status: 'pending',
          priority: 'medium',
          dueDate: null,
          listId: 'list-1',
          createdAt: mockTask.createdAt,
          updatedAt: mockTask.updatedAt,
        },
        timestamp: expect.any(Number),
      })
    })

    it('should maintain max events limit', () => {
      // Add more than MAX_EVENTS (50) events
      for (let i = 0; i < 55; i++) {
        broadcastTaskCreate({ ...mockTask, id: `task-${i}` })
      }
      const events = getRecentEvents()
      expect(events).toHaveLength(50) // Should be trimmed to MAX_EVENTS
    })
  })

  describe('broadcastTaskUpdate', () => {
    it('should add a task_updated event to recentEvents', () => {
      broadcastTaskUpdate(mockTask)
      const events = getRecentEvents()
      expect(events).toHaveLength(1)
      expect(events[0]).toMatchObject({
        id: 'test-uuid',
        type: 'task_updated',
        task: {
          id: 'task-1',
          title: 'Test Task',
          description: 'Test Description',
          status: 'pending',
          priority: 'medium',
          dueDate: null,
          listId: 'list-1',
          updatedAt: mockTask.updatedAt,
        },
        timestamp: expect.any(Number),
      })
    })
  })

  describe('broadcastTaskDelete', () => {
    it('should add a task_deleted event to recentEvents', () => {
      broadcastTaskDelete('task-1')
      const events = getRecentEvents()
      expect(events).toHaveLength(1)
      expect(events[0]).toMatchObject({
        id: 'test-uuid',
        type: 'task_deleted',
        taskId: 'task-1',
        timestamp: expect.any(Number),
      })
    })
  })

  describe('getRecentEvents', () => {
    it('should return empty array when no events', () => {
      const events = getRecentEvents()
      expect(events).toEqual([])
    })

    it('should filter events by timestamp', () => {
      const oldTime = Date.now() - 10000 // 10 seconds ago
      const recentTime = Date.now() - 1000 // 1 second ago

      // Manually add events with specific timestamps
      // @ts-ignore - accessing internal array for test setup
      recentEvents.push({
        id: 'old-event',
        type: 'task_created',
        task: { ...mockTask, id: 'old-task' },
        timestamp: oldTime,
      })

      // @ts-ignore - accessing internal array for test setup
      recentEvents.push({
        id: 'recent-event',
        type: 'task_created',
        task: { ...mockTask, id: 'recent-task' },
        timestamp: recentTime,
      })

      // Get events from 5 seconds ago - should only get recent event
      const events = getRecentEvents(Date.now() - 5000)
      expect(events).toHaveLength(1)
      expect(events[0].id).toBe('recent-event')
    })

    it('should return all events when since is 0', () => {
      broadcastTaskCreate(mockTask)
      broadcastTaskDelete('task-1')
      const events = getRecentEvents(0)
      expect(events).toHaveLength(2)
    })
  })
})