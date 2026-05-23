import { z } from 'zod';

export const createResourceSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Resource name is required'),
    type: z.enum(['MEETING_ROOM', 'DESK', 'DEVICE']),
    description: z.string().optional(),
    bufferTimeMinutes: z.number().min(0).max(120).optional(),
    capacity: z.number().min(1).optional(),
  }),
});

export const updateResourceSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    bufferTimeMinutes: z.number().min(0).max(120).optional(),
    capacity: z.number().min(1).optional(),
  }),
});