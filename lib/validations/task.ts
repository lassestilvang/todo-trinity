import { z } from 'zod'

export const taskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED'])
export const prioritySchema = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  status: taskStatusSchema.default('TODO'),
  priority: prioritySchema.default('NORMAL'),
  dueDate: z.string().datetime().optional().nullable(),
  listId: z.string().cuid().optional().nullable(),
  labelIds: z.array(z.string().cuid()).optional(),
})

export const updateTaskSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().max(2000, 'Description too long').optional().nullable(),
  status: taskStatusSchema.optional(),
  priority: prioritySchema.optional(),
  dueDate: z.string().datetime().optional().nullable(),
  listId: z.string().cuid().optional().nullable(),
  labelIds: z.array(z.string().cuid()).optional(),
})

export const deleteTaskSchema = z.object({
  id: z.string().cuid(),
})

export const taskQuerySchema = z.object({
  listId: z.string().cuid().optional(),
  labelId: z.string().cuid().optional(),
  status: taskStatusSchema.optional(),
  priority: prioritySchema.optional(),
  search: z.string().optional(),
  dateRange: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  page: z.coerce.number().min(1).default(1),
  cursor: z.string().cuid().optional(),
  sortBy: z.enum(['title', 'priority', 'dueDate', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>
export type TaskQueryInput = z.infer<typeof taskQuerySchema>