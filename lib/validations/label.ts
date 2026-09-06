import { z } from 'zod'

export const createLabelSchema = z.object({
  name: z.string().min(1, 'Label name is required').max(100, 'Label name too long'),
  color: z.string().default('#10b981'),
})

export const updateLabelSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, 'Label name is required').max(100, 'Label name too long').optional(),
  color: z.string().optional(),
})

export const deleteLabelSchema = z.object({
  id: z.string().cuid(),
})

export const labelQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  page: z.coerce.number().min(1).default(1),
})

export type CreateLabelInput = z.infer<typeof createLabelSchema>
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>
export type DeleteLabelInput = z.infer<typeof deleteLabelSchema>
export type LabelQueryInput = z.infer<typeof labelQuerySchema>