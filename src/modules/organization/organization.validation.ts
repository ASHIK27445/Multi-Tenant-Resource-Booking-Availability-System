import { z } from 'zod';

const timeStringRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

const workingHoursSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(timeStringRegex, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(timeStringRegex, 'Invalid time format (HH:mm)'),
  isWorkingDay: z.boolean(),
});

const bookingPolicySchema = z.object({
  minDurationMinutes: z.number().min(15).default(30),
  maxDurationMinutes: z.number().max(480).default(240),
  maxAdvanceBookingDays: z.number().min(1).default(30),
  minAdvanceBookingHours: z.number().min(0).default(1),
  bufferTimeMinutes: z.number().min(0).default(15),
});

export const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Organization name is required'),
    timezone: z.string().min(1, 'Timezone is required'),
    workingHours: z.array(workingHoursSchema).min(1, 'At least one working day required'),
    bookingPolicy: bookingPolicySchema,
  }),
});

export const updateOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    timezone: z.string().min(1).optional(),
    workingHours: z.array(workingHoursSchema).optional(),
    bookingPolicy: bookingPolicySchema.optional(),
    isActive: z.boolean().optional(),
  }),
});