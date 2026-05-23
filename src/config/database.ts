import mongoose from 'mongoose';
import { environment } from './environment';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(environment.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

mongoose.set('autoIndex', environment.NODE_ENV !== 'production')