import {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
  prioritySchema,
  taskStatusSchema,
} from '@/lib/validations/task'

import {
  createListSchema,
  updateListSchema,
  listQuerySchema,
} from '@/lib/validations/list'

import {
  createLabelSchema,
  updateLabelSchema,
  labelQuerySchema,
} from '@/lib/validations/label'

import {
  loginSchema,
  registerSchema,
} from '@/lib/validations/auth'

describe('lib/validations/task', () => {
  describe('taskStatusSchema', () => {
    it('should validate valid status values', () => {
      expect(taskStatusSchema.parse('TODO')).toBe('TODO')
      expect(taskStatusSchema.parse('IN_PROGRESS')).toBe('IN_PROGRESS')
      expect(taskStatusSchema.parse('COMPLETED')).toBe('COMPLETED')
    })

    it('should reject invalid status values', () => {
      expect(() => taskStatusSchema.parse('INVALID')).toThrow()
      expect(() => taskStatusSchema.parse(''))
    })
  })

  describe('prioritySchema', () => {
    it('should validate valid priority values', () => {
      expect(prioritySchema.parse('LOW')).toBe('LOW')
      expect(prioritySchema.parse('NORMAL')).toBe('NORMAL')
      expect(prioritySchema.parse('HIGH')).toBe('HIGH')
      expect(prioritySchema.parse('URGENT')).toBe('URGENT')
    })

    it('should reject invalid priority values', () => {
      expect(() => prioritySchema.parse('INVALID')).toThrow()
    })
  })

  describe('createTaskSchema', () => {
    it('should validate valid task data', () => {
      const validData = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'TODO' as const,
        priority: 'NORMAL' as const,
        dueDate: '2026-12-31T23:59:59.999Z',
        listId: 'cl123',
        labelIds: ['cl456'],
      }
      const result = createTaskSchema.parse(validData)
      expect(result.title).toBe('Test Task')
      expect(result.status).toBe('TODO')
      expect(result.priority).toBe('NORMAL')
    })

    it('should apply default values', () => {
      const data = { title: 'Test Task' }
      const result = createTaskSchema.parse(data)
      expect(result.status).toBe('TODO')
      expect(result.priority).toBe('NORMAL')
      expect(result.description).toBeUndefined()
      expect(result.dueDate).toBeUndefined()
      expect(result.listId).toBeUndefined()
      expect(result.labelIds).toBeUndefined()
    })

    it('should reject empty title', () => {
      expect(() => createTaskSchema.parse({ title: '' })).toThrow()
    })

    it('should reject title too long', () => {
      const longTitle = 'a'.repeat(201)
      expect(() => createTaskSchema.parse({ title: longTitle })).toThrow()
    })

    it('should reject description too long', () => {
      const longDescription = 'a'.repeat(2001)
      expect(() => createTaskSchema.parse({ title: 'Test', description: longDescription })).toThrow()
    })

    it('should reject invalid dueDate', () => {
      expect(() => createTaskSchema.parse({ title: 'Test', dueDate: 'invalid-date' })).toThrow()
    })
  })

  describe('updateTaskSchema', () => {
    it('should validate partial task data', () => {
      const data = {
        id: 'cl123',
        title: 'Updated Task',
        status: 'COMPLETED' as const,
      }
      const result = updateTaskSchema.parse(data)
      expect(result.id).toBe('cl123')
      expect(result.title).toBe('Updated Task')
      expect(result.status).toBe('COMPLETED')
    })

    it('should allow optional fields', () => {
      const data = { id: 'cl123' }
      const result = updateTaskSchema.parse(data)
      expect(result.id).toBe('cl123')
    })
  })

  describe('taskQuerySchema', () => {
    it('should validate valid query params', () => {
      const data = {
        listId: 'cl123',
        status: 'TODO',
        priority: 'HIGH',
        search: 'test',
        dateRange: '2026-10-10,2026-10-20',
        limit: 50,
        page: 1,
        cursor: 'cl456',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }
      const result = taskQuerySchema.parse(data)
      expect(result.listId).toBe('cl123')
      expect(result.status).toBe('TODO')
      expect(result.sortBy).toBe('createdAt')
    })

    it('should apply defaults', () => {
      const data = {}
      const result = taskQuerySchema.parse(data)
      expect(result.limit).toBe(50)
      expect(result.page).toBe(1)
      expect(result.sortBy).toBe('createdAt')
      expect(result.sortOrder).toBe('desc')
    })

    it('should reject limit out of range', () => {
      expect(() => taskQuerySchema.parse({ limit: 0 })).toThrow()
      expect(() => taskQuerySchema.parse({ limit: 101 })).toThrow()
    })

    it('should reject page too small', () => {
      expect(() => taskQuerySchema.parse({ page: 0 })).toThrow()
    })
  })
})

describe('lib/validations/list', () => {
  describe('createListSchema', () => {
    it('should validate valid list data', () => {
      const data = { name: 'Test List' }
      expect(createListSchema.parse(data).name).toBe('Test List')
    })

    it('should reject empty name', () => {
      expect(() => createListSchema.parse({ name: '' })).toThrow()
    })

    it('should reject name too long', () => {
      const longName = 'a'.repeat(101)
      expect(() => createListSchema.parse({ name: longName })).toThrow()
    })
  })

  describe('updateListSchema', () => {
    it('should validate partial update data', () => {
      const data = {
        id: 'cl123',
        name: 'Updated List',
      }
      expect(updateListSchema.parse(data).id).toBe('cl123')
    })
  })

  describe('listQuerySchema', () => {
    it('should validate valid query params', () => {
      const data = {
        limit: 50,
        page: 1,
      }
      expect(listQuerySchema.parse(data).limit).toBe(50)
      expect(listQuerySchema.parse(data).page).toBe(1)
    })
  })
})

describe('lib/validations/label', () => {
  describe('createLabelSchema', () => {
    it('should validate valid label data', () => {
      const data = { name: 'Test Label', color: '#ff0000' }
      expect(createLabelSchema.parse(data).name).toBe('Test Label')
    })

    it('should reject empty name', () => {
      expect(() => createLabelSchema.parse({ name: '', color: '#ff0000' })).toThrow()
    })

    it('should validate color format', () => {
      expect(() => createLabelSchema.parse({ name: 'Test', color: '#123' })).toThrow()
      expect(createLabelSchema.parse({ name: 'Test', color: '#123456' })).toBeDefined()
    })

    it('should reject invalid color', () => {
      expect(() => createLabelSchema.parse({ name: 'Test', color: 'invalid' })).toThrow()
    })
  })

  describe('updateLabelSchema', () => {
    it('should validate partial update data', () => {
      const data = {
        id: 'cl123',
        name: 'Updated Label',
      }
      expect(updateLabelSchema.parse(data).id).toBe('cl123')
    })
  })

  describe('labelQuerySchema', () => {
    it('should validate valid query params', () => {
      const data = {
        limit: 50,
        page: 1,
      }
      expect(labelQuerySchema.parse(data).limit).toBe(50)
    })
  })
})

describe('lib/validations/auth', () => {
  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const data = {
        email: 'test@example.com',
        password: 'Password123',
      }
      expect(loginSchema.parse(data).email).toBe('test@example.com')
    })

    it('should reject invalid email', () => {
      expect(() => loginSchema.parse({ email: 'invalid', password: 'pass' })).toThrow()
    })

    it('should reject weak password', () => {
      expect(() => loginSchema.parse({ email: 'test@test.com', password: '123' })).toThrow()
    })
  })

  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const data = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
      }
      expect(registerSchema.parse(data).email).toBe('test@example.com')
    })

    it('should reject missing name', () => {
      expect(() => registerSchema.parse({ email: 'test@test.com', password: 'pass' })).toThrow()
    })
  })
})