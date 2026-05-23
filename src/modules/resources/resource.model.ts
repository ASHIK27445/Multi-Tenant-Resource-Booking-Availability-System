import mongoose, { Schema, Document } from 'mongoose';
import { ITenantIsolated, ITimestamps, ISoftDeletable } from '../../shared/types/common.types';

export interface IResource extends Document, ITenantIsolated, ITimestamps, ISoftDeletable {
  name: string;
  type: 'MEETING_ROOM' | 'DESK' | 'DEVICE';
  description?: string;
  isActive: boolean;
  bufferTimeMinutes?: number;
  capacity?: number;
}

const resourceSchema = new Schema<IResource>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['MEETING_ROOM', 'DESK', 'DEVICE'],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    bufferTimeMinutes: {
      type: Number,
      min: 0,
      max: 120,
    },
    capacity: {
      type: Number,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index for resource name within organization
resourceSchema.index(
  { organizationId: 1, name: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

// Soft delete middleware
resourceSchema.pre('find', function () {
  this.where({ isDeleted: false });
});

resourceSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const Resource = mongoose.model<IResource>('Resource', resourceSchema);