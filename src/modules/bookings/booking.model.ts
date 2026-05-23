import mongoose, { Schema, Document } from 'mongoose';
import { ITenantIsolated, ITimestamps, ISoftDeletable } from '../../shared/types/common.types';

export interface IBooking extends Document, ITenantIsolated, ITimestamps, ISoftDeletable {
  resourceId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  title: string;
  description?: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  cancelledAt?: Date;
  cancelledBy?: mongoose.Types.ObjectId;
}

const bookingSchema = new Schema<IBooking>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: IBooking, value: Date) {
          return value > this.startTime;
        },
        message: 'End time must be after start time',
      },
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['CONFIRMED', 'CANCELLED', 'COMPLETED'],
      default: 'CONFIRMED',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
)

bookingSchema.index({ resourceId: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ organizationId: 1, startTime: 1, endTime: 1 });
bookingSchema.index(
  { resourceId: 1, status: 1, startTime: 1, endTime: 1 },
  { 
    partialFilterExpression: { 
      status: 'CONFIRMED',
      isDeleted: false 
    } 
  }
);

// Soft delete middleware
bookingSchema.pre('find', function () {
  this.where({ isDeleted: false });
});

bookingSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);