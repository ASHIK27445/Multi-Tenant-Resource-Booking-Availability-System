import { z } from 'zod';

export const getAvailabilitySchema = z.object({
  query: z.object({
    resourceId: z.string().min(1, 'Resource ID is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
    startDate: z.string().datetime('Invalid start date').optional(),
    endDate: z.string().datetime('Invalid end date').optional(),
    durationMinutes: z.string().transform(Number).pipe(
      z.number().min(15).max(480)
    ).optional(),
  }),
});