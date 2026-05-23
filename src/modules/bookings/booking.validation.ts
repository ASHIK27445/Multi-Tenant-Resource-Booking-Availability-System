import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    resourceId: z.string().min(1, 'Resource ID is required'),
    startTime: z.string().datetime('Invalid start time'),
    endTime: z.string().datetime('Invalid end time'),
    title: z.string().min(1, 'Booking title is required'),
    description: z.string().optional(),
  }),
});

export const getBookingsQuerySchema = z.object({
  query: z.object({
    resourceId: z.string().optional(),
    status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: z.string().transform(Number).optional(),
    limit: z.string().transform(Number).optional(),
  }),
});