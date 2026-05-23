import mongoose, { Schema, Document } from 'mongoose';
import { ITimestamps, WorkingHours, BookingPolicy } from '../../shared/types/common.types';

export interface IOrganization extends Document, ITimestamps {
  name: string;
  timezone: string;
  isActive: boolean;
  workingHours: WorkingHours[];
  bookingPolicy: BookingPolicy;
}

const workingHoursSchema = new Schema<WorkingHours>(
  {
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    startTime: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
        message: 'Invalid time format. Use HH:mm',
      },
    },
    endTime: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
        message: 'Invalid time format. Use HH:mm',
      },
    },
    isWorkingDay: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const bookingPolicySchema = new Schema<BookingPolicy>(
  {
    minDurationMinutes: {
      type: Number,
      required: true,
      min: 15,
      default: 30,
    },
    maxDurationMinutes: {
      type: Number,
      required: true,
      max: 480,
      default: 240,
    },
    maxAdvanceBookingDays: {
      type: Number,
      required: true,
      min: 1,
      default: 30,
    },
    minAdvanceBookingHours: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    bufferTimeMinutes: {
      type: Number,
      required: true,
      min: 0,
      default: 15,
    },
  },
  { _id: false }
);

const organizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    timezone: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => {
          const { IANAZone } = require('luxon');
          return IANAZone.isValidZone(v);
        },
        message: 'Invalid timezone',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    workingHours: {
      type: [workingHoursSchema],
      validate: {
        validator: (hours: WorkingHours[]) => {
          // Ensure at least one working day
          return hours.some((h) => h.isWorkingDay);
        },
        message: 'Organization must have at least one working day',
      },
    },
    bookingPolicy: {
      type: bookingPolicySchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for active organizations
organizationSchema.index({ isActive: 1 });

export const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);