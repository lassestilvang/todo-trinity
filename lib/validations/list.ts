import { z } from 'zod'

export const colorSchema = z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Invalid color format').optional()

export const listIconSchema = z.string().max(50, 'Icon name too long').optional().default('')

export const createListSchema = z.object({
  name: z.string().min(1, 'List name is required').max(100, 'List name too long'),
  color: z.string().default('#6366f1'),
  icon: z.string().default(''),
})

export const updateListSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, 'List name is required').max(100, 'List name too long').optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
})

export const deleteListSchema = z.object({
  id: z.string().cuid(),
})

export const listQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  page: z.coerce.number().min(1).default(1),
})

export type CreateListInput = z.infer<typeof createListSchema>
export type UpdateListInput = z.infer<typeof updateListSchema>
export type DeleteListInput = z.infer<typeof deleteListSchema>
export type ListQueryInput = z.infer<typeof listQuerySchema>