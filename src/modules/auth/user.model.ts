import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import { ITenantIsolated, ITimestamps } from '../../shared/types/common.types';
import { environment } from '../../config/environment';

export interface IUser extends Document, ITenantIsolated, ITimestamps {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'ORG_ADMIN' | 'EMPLOYEE';
  isActive: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['ORG_ADMIN', 'EMPLOYEE'],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

userSchema.index({ organizationId: 1, email: 1 }, { unique: true });

// Hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(environment.BCRYPT_SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
})

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);