import { Document, Types } from 'mongoose';

export interface ITenantIsolated {
  organizationId: Types.ObjectId;
}

export interface ITimestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface ISoftDeletable {
  isDeleted: boolean;
  deletedAt?: Date;
}

export type TimeSlot = {
  start: Date;
  end: Date;
};

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface WorkingHours {
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isWorkingDay: boolean;
}

export interface BookingPolicy {
  minDurationMinutes: number;
  maxDurationMinutes: number;
  maxAdvanceBookingDays: number;
  minAdvanceBookingHours: number;
  bufferTimeMinutes: number;
}